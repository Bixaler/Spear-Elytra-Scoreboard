import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  EyeOff,
  MonitorPlay,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import type { AnchorId, EntranceStyle } from '../../types';
import { useStore } from '../../state/store';
import { routeUrl } from '../../utils/urls';
import { BroadcastTriggers } from './BroadcastTriggers';
import { Btn, Field, Panel, Segmented, Slider, Toggle } from '../ui/kit';

/**
 * OVERLAY CONTROLS — visibility, position, scale, entrance style,
 * animation tuning and one-shot broadcast triggers.
 */

const ANCHORS: AnchorId[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

export function OverlayTab() {
  const { state, setOverlay, setSettings, sendCommand, replayEntrance } = useStore();
  const [copied, setCopied] = useState(false);
  const o = state.overlay;

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(routeUrl('overlay'));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="tab-body">
      <div className="overlay-grid">
        <Panel title="Visibility" icon={<MonitorPlay size={15} />}>
          <Toggle
            checked={o.visible}
            onChange={(v) => setOverlay({ visible: v })}
            label={o.visible ? 'Scoreboard visible' : 'Scoreboard hidden'}
            hint="master show / hide for scene transitions"
          />
          <div className="overlay-link-row">
            <Btn size="sm" variant="ghost" icon={<ExternalLink size={13} />} onClick={() => window.open(routeUrl('overlay'), '_blank')}>
              Open overlay
            </Btn>
            <Btn size="sm" variant="ghost" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={() => void copyUrl()}>
              {copied ? 'Copied!' : 'Copy overlay URL'}
            </Btn>
          </div>
        </Panel>

        <Panel title="Position" icon={<MonitorPlay size={15} />}>
          <Field label="Anchor" hint="where the board docks on the canvas">
            <div className="anchor-grid">
              {ANCHORS.map((a) => (
                <button
                  key={a}
                  type="button"
                  className={`anchor-cell ${o.anchor === a ? 'is-active' : ''}`}
                  onClick={() => setOverlay({ anchor: a })}
                  title={a}
                >
                  <span />
                </button>
              ))}
            </div>
          </Field>
          <Field label={`Horizontal offset · ${o.offsetX}px`}>
            <Slider value={o.offsetX} min={-240} max={240} onChange={(v) => setOverlay({ offsetX: v })} />
          </Field>
          <Field label={`Vertical offset · ${o.offsetY}px`}>
            <Slider value={o.offsetY} min={-160} max={160} onChange={(v) => setOverlay({ offsetY: v })} />
          </Field>
          <Field label="Scale">
            <Slider
              value={o.scale}
              min={0.6}
              max={1.6}
              step={0.05}
              onChange={(v) => setOverlay({ scale: v })}
              format={(v) => `${Math.round(v * 100)}%`}
            />
          </Field>
        </Panel>

        <Panel title="Entrance & animation" icon={<Sparkles size={15} />}>
          <Field label="Entrance transition">
            <Segmented
              value={o.entrance}
              onChange={(v: EntranceStyle) => setOverlay({ entrance: v })}
              options={[
                { value: 'slide', label: 'Slide' },
                { value: 'rise', label: 'Rise' },
                { value: 'glitch', label: 'Glitch' },
                { value: 'fade', label: 'Fade' },
              ]}
            />
          </Field>
          <div className="overlay-link-row">
            <Btn size="sm" icon={<RotateCcw size={13} />} onClick={replayEntrance}>
              Replay entrance
            </Btn>
          </div>
          <Field label="Animation intensity">
            <Segmented
              value={state.settings.intensity}
              onChange={(v) => setSettings({ intensity: v })}
              options={[
                { value: 'minimal', label: 'Minimal' },
                { value: 'standard', label: 'Standard' },
                { value: 'cinematic', label: 'Cinematic' },
              ]}
            />
          </Field>
          <Field label="Animation speed">
            <Slider
              value={state.settings.speed}
              min={0.5}
              max={2}
              step={0.1}
              onChange={(v) => setSettings({ speed: v })}
              format={(v) => `${v.toFixed(1)}×`}
            />
          </Field>
        </Panel>

        <Panel title="Broadcast triggers" icon={<Crown size={15} />}>
          <BroadcastTriggers />
        </Panel>

        <Panel title="Board modules" icon={<Eye size={15} />}>
          <Toggle
            checked={o.showTimer}
            onChange={(v) => setOverlay({ showTimer: v })}
            label="Match clock"
            hint="center timer plate"
          />
          <Toggle
            checked={o.showLogo}
            onChange={(v) => setOverlay({ showLogo: v })}
            label="Tournament logo"
            hint="shown above the clock when an image is assigned"
          />
          <Toggle
            checked={state.settings.autoHideBreak}
            onChange={(v) => setSettings({ autoHideBreak: v })}
            label="Auto-hide break module"
            hint="fades out 8 s after the countdown completes"
          />
        </Panel>
      </div>
    </div>
  );
}
