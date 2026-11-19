# ARENA CX — Cyberpunk Minecraft Esports Scoreboard

A premium broadcast scoreboard overlay for **Minecraft PvP tournaments**, built for
**OBS Studio** Browser Sources and static hosting (GitHub Pages). Cyberpunk broadcast
identity, Minecraft-inspired details, cinematic Framer Motion animations — and a full
operator control room.

![Tech](https://img.shields.io/badge/React_18-TypeScript_Vite-8B5CF6) ![Hosting](https://img.shields.io/badge/GitHub_Pages-ready-63E6BE)

---

## Features

### Broadcast overlay (`/overlay` route)
- **Transparent** full-viewport stage — no background, no scrollbars, no UI chrome.
  Perfect for OBS Browser Source at 1920x1080 (and other 16:9 canvases).
- Two competitor panels: **frameless** portrait (scalable 60–150%, optional
  **horizontal & vertical flip** — the same picture is used everywhere), name,
  country flag, and three **fully independent** statistics:
  - **Rounds Won** — the big primary plate; the number sits dead-centre in its box
  - **Duel Wins** — compact secondary counter beside the Totem slot
  - **Totem of Undying** — dedicated inventory-style slot (icon slot stays **empty**
    until you upload your own artwork)
  - No icon artwork on the two win counters — clean numbers only.
- Center stage: tournament logo, VS emblem, match clock.
- One-shot cinematics: player introduction (mirrored plates:
  `portrait · name · VS · name · portrait`), **duel victory** banner, **round won** ribbon.
- Animated everywhere a value changes: rolling digits, neon flash that always
  **glides back to white** (including when a counter is reset to 0), pixel-burst
  totem consumption, glowing totem acquisition.
- Anchor / offset / scale controls, four entrance styles (slide, rise, glitch, fade),
  animation intensity + speed tuning.

### Control room (`/control` route)
- **Match** — the complete match surface: per-player steppers (increment /
  decrement / manual edit) for all six statistics, BO3 / BO5 / BO7 duel formats,
  **victory linking**, the **time systems** (count-up + break countdown) and the
  **broadcast triggers** (intro / duel victory / round victory / reset):
  - `+ Round` fires the round-won ribbon,
  - reaching the duel target (5 rounds in BO5) **auto-credits the Duel Win** and
    plays the duel-victory cinematic,
  - `+ Duel` plays the cinematic.
  Linking can be switched off for fully manual scoring. Totems never trigger effects.
  Minecraft-style pixel-block progress shows each player's path to the duel win.
- **Match-flow automations** (toggleable in Match rules):
  - **Round-win flow** — the count-up clock resets to 00:00, and after the ribbon
    cooldown both players' **Totems return to 2** for the next round,
  - **Duel-win flow** — the **break countdown starts** immediately, and after the
    cinematic both players' **Rounds Won reset to 0** for the next duel.
- **Players** — names (any letter case, small and capitals), country codes,
  portrait / flag uploads, **portrait flip (H / V)** and the shared
  **portrait scale** slider for the frameless scoreboard portraits.
- **Timers** — count-up match timer (epoch-based: accurate across tab throttling
  and refreshes) + break countdown with presets, urgency phase, chime and auto-hide.
- **Overlay** — visibility, position, scale, entrance, animation tuning, broadcast
  triggers, module toggles.
- **Assets** — two folders: **Player photos** (portrait photos with direct
  → P1 / → P2 assignment — photos are used for portraits only) and **Assets**
  (labelled, intentionally empty slots: totem icon, logo, background, custom
  items, plus the player flags). Nothing is auto-generated.

### Data
- Settings, scores, timers and image references persist in **LocalStorage**;
  image binaries live in **IndexedDB** (never base64 in LocalStorage).
- Live sync between control panel and overlay via **BroadcastChannel** — open both in
  the same browser (or as OBS docks) and changes propagate instantly.
- Structured as a single store with pure actions, ready for a future shared
  real-time backend.

---

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

- Control room: <http://localhost:5173/#/control>
- Overlay: <http://localhost:5173/#/overlay>

### 3. Build for production

```bash
npm run build     # outputs static site to dist/
npm run preview   # serve the production build locally
```

### 4. Deploy to GitHub Pages

The repo ships with `.github/workflows/deploy.yml`. To publish:

1. Push the project to a GitHub repository (branch `main`).
2. In the repository: **Settings → Pages → Build and deployment → Source**:
   choose **GitHub Actions**.
3. The workflow builds with the correct `VITE_BASE_PATH` (auto-detected from the repo
   name) and deploys `dist/` to Pages.
4. Your overlay lives at
   `https://<user>.github.io/<repo>/#/overlay`.

For a user/org site (`<user>.github.io`) the app is served from the domain root and
the workflow handles that automatically.

Routing works with clean paths (`/overlay`, `/control`) **and** hash routes
(`#/overlay`, `#/control`); hash routes are the safest on any static host.

---

## OBS Studio setup

1. In OBS: **Sources → + → Browser**.
2. Paste the overlay URL, e.g.
   `https://<user>.github.io/<repo>/#/overlay` (or your local dev URL).
3. Recommended settings:
   - **Width:** 1920, **Height:** 1080 (matches the design canvas; other 16:9
     resolutions work — use the scale / anchor controls),
   - **FPS:** 60,
   - **Custom CSS:** leave empty — the page is already transparent and borderless,
   - check **Shutdown source when not visible**: OFF (keeps animations and sync alive),
   - check **Refresh browser when scene becomes active**: optional.
4. Open the control room on a second monitor / browser:
   `https://<user>.github.io/<repo>/#/control`.
   Scores, timers and triggers pushed there appear on the overlay in real time.

> LocalStorage is per browser/computer — the overlay browser source and the control
> panel must run on the same machine (or OBS custom browser docks) to share state.

---

## Project structure

```
src/
  components/
    overlay/    # broadcast-only surface (transparent, no admin UI)
    control/    # operator control room (never rendered in the overlay)
    common/     # shared image rendering with graceful fallbacks
    ui/         # custom-styled kit: buttons, panels, steppers, modal…
    landing/    # route chooser
  state/        # store (actions), persistence, IndexedDB image store, sync
  hooks/        # useNow (frame-rate-independent ticking), useAssetUrl
  styles/       # tokens, global, ui, overlay, control stylesheets
  utils/        # motion language, formatting, sound, file picking, ids
  types.ts      # domain model — the three statistics are separate fields
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run typecheck` | Strict TypeScript check |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Preview the production build |
