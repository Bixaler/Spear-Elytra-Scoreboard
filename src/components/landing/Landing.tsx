import { Check, Copy, ExternalLink, MonitorPlay, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { routeUrl } from '../../utils/urls';
import { Btn } from '../ui/kit';

/**
 * Landing page: routes into the app + quick OBS setup pointers.
 * In normal broadcast use you will rarely see this — the operator works in
 * #/control and OBS loads #/overlay directly.
 */
export function Landing() {
  const [copied, setCopied] = useState<'overlay' | 'control' | null>(null);

  const copy = async (route: 'overlay' | 'control') => {
    try {
      await navigator.clipboard.writeText(routeUrl(route));
      setCopied(route);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="landing">
      <div className="landing-grid-bg" aria-hidden />
      <header className="landing-hero">
        <span className="landing-kicker">MINECRAFT PVP · BROADCAST SUITE</span>
        <h1>
          ARENA <em>CX</em>
        </h1>
        <p>
          Cyberpunk esports scoreboard for Minecraft duels. Transparent OBS overlay, independent
          duel / round / totem statistics, cinematic animations.
        </p>
      </header>

      <div className="landing-cards">
        <a className="route-card route-card--overlay" href="#/overlay">
          <span className="route-card-icon">
            <MonitorPlay size={22} />
          </span>
          <h3>Broadcast Overlay</h3>
          <p>Transparent scoreboard for OBS Browser Source. Load this URL in OBS — not in your normal browser tab.</p>
          <div className="route-card-foot">
            <code>{routeUrl('overlay')}</code>
            <button
              type="button"
              className="route-card-copy"
              onClick={(e) => {
                e.preventDefault();
                void copy('overlay');
              }}
              title="Copy overlay URL"
            >
              {copied === 'overlay' ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </a>

        <a className="route-card route-card--control" href="#/control">
          <span className="route-card-icon route-card-icon--control">
            <SlidersHorizontal size={22} />
          </span>
          <h3>Control Room</h3>
          <p>Scores, players, timers, asset uploads and broadcast triggers. Keep this open on your operator machine.</p>
          <div className="route-card-foot">
            <code>{routeUrl('control')}</code>
            <button
              type="button"
              className="route-card-copy"
              onClick={(e) => {
                e.preventDefault();
                void copy('control');
              }}
              title="Copy control URL"
            >
              {copied === 'control' ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </a>
      </div>

      <footer className="landing-foot">
        <Btn variant="ghost" icon={<ExternalLink size={13} />} onClick={() => window.open('#/control', '_self')}>
          Enter the control room
        </Btn>
        <p>Tip: in OBS, add the control room as a Custom Browser Dock — it shares state with the browser source live.</p>
      </footer>
    </div>
  );
}
