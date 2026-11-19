# ARENA CX — Minecraft Esports Scoreboard

A professional Minecraft PvP tournament scoreboard designed for OBS Studio and GitHub Pages, featuring a transparent broadcast overlay, a dedicated control panel, and smooth animations.

## Features

### Broadcast Overlay (`#/overlay`)
- Transparent, borderless overlay optimized for OBS at 1920×1080.
- Two player panels with portraits, names, country flags and independent statistics:
  - **Rounds Won**
  - **Duel Wins**
  - **Totem of Undying**
- Tournament logo, VS emblem and match timer.
- Player introduction, duel victory and round victory animations.
- Customizable portrait size, flipping, overlay position and scale.
- Smooth score transitions and Totem animations.
- Adjustable animation speed and intensity.

### Control Panel (`#/control`)

- **Match:** Manage scores, BO3 / BO5 / BO7 formats, victory linking and match events.
- **Players:** Edit names, country flags and portraits.
- **Timers:** Control match timer and break countdown.
- **Overlay:** Manage visibility, positioning, scale, animations and display options.
- **Assets:** Upload player photos, flags, tournament logo, Totem icon and other custom images.

All three statistics must remain completely independent.

### Match Automation
- Automatically award a Duel Win when the required number of rounds is reached, if victory linking is enabled.
- Optional round-win automation: reset the match timer and restore both players' Totems to 2.
- Optional duel-win automation: start the break countdown and reset Rounds Won for the next duel.
- Manual scoring is always available.

### Storage and Synchronization
- LocalStorage for settings, scores and timers.
- IndexedDB for uploaded images.
- BroadcastChannel for real-time synchronization between the control panel and overlay in the same browser.
- Architecture ready for future remote synchronization.

## Technology

- React 18
- TypeScript
- Vite
- Custom CSS
- Framer Motion
- Lucide Icons

## GitHub Pages Deployment

The project must support static hosting through GitHub Pages.

- Include a GitHub Actions deployment workflow.
- Automatically configure the Vite base path.
- Support hash-based routing.
- Generate a production build in `dist/`.

## OBS Studio Integration

The overlay must be compatible with OBS Browser Source.

Recommended settings:

- Width: 1920
- Height: 1080
- FPS: 60
- Transparent background
- No margins or scrollbars

Example URLs:

- Control Panel: `https://<user>.github.io/<repo>/#/control`
- OBS Overlay: `https://<user>.github.io/<repo>/#/overlay`

## Final Requirements

Build a fully functional application, not a static mockup.

Prioritize:

1. Scoreboard visual quality.
2. Smooth and polished animations.
3. Clear presentation of player statistics.
4. Reliable control panel functionality.
5. OBS compatibility.
6. Responsive design and maintainable code.

The final result should look like a professional Minecraft esports broadcast scoreboard, with a clean, distinctive visual identity and an intuitive operator experience.
