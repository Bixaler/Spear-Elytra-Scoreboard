import { useState, type ReactNode } from 'react';
import {
  ExternalLink,
  Eye,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  MonitorPlay,
  Pause,
  Play,
  Swords,
  Timer,
  Users,
} from 'lucide-react';
import { matchElapsedMs, useStore } from '../../state/store';
import { useNow } from '../../hooks/useNow';
import { formatMMSS } from '../../utils/format';
import { routeUrl } from '../../utils/urls';
import { MatchTab } from './MatchTab';
import { PlayersTab } from './PlayersTab';
import { TimersTab } from './TimersTab';
import { OverlayTab } from './OverlayTab';
import { AssetsTab } from './AssetsTab';
import { cn } from '../../utils/cn';

/**
 * ARENA CX control room. This is the operator-facing surface; it is a
 * completely separate route from the OBS overlay and never renders inside it.
 */

type TabId = 'match' | 'players' | 'timers' | 'overlay' | 'assets';

const TABS: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'match', label: 'Match', icon: <Swords size={16} /> },
  { id: 'players', label: 'Players', icon: <Users size={16} /> },
  { id: 'timers', label: 'Timers', icon: <Timer size={16} /> },
  { id: 'overlay', label: 'Overlay', icon: <MonitorPlay size={16} /> },
  { id: 'assets', label: 'Assets', icon: <FolderOpen size={16} /> },
];

const TAB_TITLES: Record<TabId, string> = {
  match: 'Score management',
  players: 'Player management',
  timers: 'Time systems',
  overlay: 'Overlay controls',
  assets: 'Photos & assets',
};

/** Brand mark: pixel diamond echoing the favicon. */
function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden>
      <svg viewBox="0 0 32 32" width="26" height="26">
        <rect x="1" y="1" width="30" height="30" fill="none" stroke="#8B5CF6" strokeWidth="2" />
        <rect x="7" y="7" width="18" height="18" fill="#8B5CF6" />
        <rect x="11" y="11" width="10" height="10" fill="#21152F" />
        <rect x="13" y="13" width="6" height="6" fill="#63E6BE" />
      </svg>
    </span>
  );
}

export function ControlApp() {
  const [tab, setTab] = useState<TabId>('match');
  const { state, setOverlay, startMatchTimer, pauseMatchTimer } = useStore();
  const now = useNow(state.timer.mode === 'running');
  const running = state.timer.mode === 'running';

  return (
    <div className="ctl">
      <aside className="ctl-side">
        <div className="ctl-brand">
          <BrandMark />
          <div className="ctl-brand-text">
            <strong>ARENA CX</strong>
            <span>CONTROL ROOM</span>
          </div>
        </div>

        <nav className="ctl-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn('ctl-nav-btn', tab === t.id && 'is-active')}
              onClick={() => setTab(t.id)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        <div className="ctl-foot">
          <a className="ctl-open-overlay" href={routeUrl('overlay')} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            <span>Open overlay</span>
          </a>
          <div className="ctl-sync">
            <span className="ctl-sync-dot" aria-hidden />
            LOCAL SYNC · <abbr title="Same-browser contexts (tabs / OBS docks) receive live updates">v{state.rev}</abbr>
          </div>
        </div>
      </aside>

      <div className="ctl-main">
        <header className="ctl-top">
          <div className="ctl-top-title">
            <span className="ctl-kicker">CONTROL</span>
            <h2>{TAB_TITLES[tab]}</h2>
          </div>
          <div className="ctl-quick">
            <span className="ctl-quick-clock">{formatMMSS(matchElapsedMs(state.timer, now))}</span>
            {running ? (
              <button
                type="button"
                className="ctl-quick-btn ctl-quick-btn--pause"
                onClick={pauseMatchTimer}
                title="Pause match timer"
              >
                <Pause size={14} />
              </button>
            ) : (
              <button
                type="button"
                className="ctl-quick-btn"
                onClick={startMatchTimer}
                title="Start match timer"
              >
                <Play size={14} />
              </button>
            )}
            <button
              type="button"
              className={cn('ctl-quick-btn', state.overlay.visible && 'ctl-quick-btn--on')}
              onClick={() => setOverlay({ visible: !state.overlay.visible })}
              title={state.overlay.visible ? 'Hide scoreboard' : 'Show scoreboard'}
            >
              {state.overlay.visible ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>
        </header>

        <main className="ctl-content">
          {tab === 'match' && <MatchTab />}
          {tab === 'players' && <PlayersTab />}
          {tab === 'timers' && <TimersTab />}
          {tab === 'overlay' && <OverlayTab />}
          {tab === 'assets' && <AssetsTab />}
        </main>
      </div>
    </div>
  );
}
