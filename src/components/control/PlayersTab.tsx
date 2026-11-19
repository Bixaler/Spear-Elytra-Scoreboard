import {
  FlipHorizontal2,
  FlipVertical2,
  Flag,
  Image as ImageIcon,
  RotateCcw,
  UserRound,
} from 'lucide-react';
import type { PlayerIndex } from '../../types';
import { useStore } from '../../state/store';
import { TextInput } from '../ui/kit';
import { Field, Panel, Slider } from '../ui/kit';
import { ImagePickControl } from './ImagePickControl';
import { cn } from '../../utils/cn';

/**
 * PLAYER MANAGEMENT — names (any letter case), country codes, portraits,
 * custom flag images and the shared scoreboard portrait scale.
 * The scoreboard portrait is FRAMELESS and shows the same picture
 * everywhere (panel, victory banner, intro) — there is no separate
 * alternate portrait any more.
 */
export function PlayerEditor({ index }: { index: PlayerIndex }) {
  const { state, setPlayerConfig } = useStore();
  const player = state.players[index];

  return (
    <Panel title={index === 0 ? 'Player One' : 'Player Two'} icon={<UserRound size={15} />}>
      <Field label="Display name" hint="any case — shown on the broadcast overlay">
        <TextInput
          value={player.name}
          maxLength={24}
          placeholder="Player name"
          onChange={(e) => setPlayerConfig(index, { name: e.target.value })}
        />
      </Field>

      <Field label="Country code" hint="2–3 letters, e.g. PL / DE / BR">
        <TextInput
          value={player.country}
          maxLength={3}
          placeholder="—"
          className="text-input--code"
          onChange={(e) =>
            setPlayerConfig(index, { country: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })
          }
        />
      </Field>

      <Field label="Portrait flip" hint="mirror the photo on the overlay — H = left/right, V = top/bottom">
        <div className="flip-controls">
          <button
            type="button"
            className={cn('flip-btn', player.flipX && 'is-active')}
            aria-pressed={player.flipX}
            title="Flip portrait horizontally"
            onClick={() => setPlayerConfig(index, { flipX: !player.flipX })}
          >
            <FlipHorizontal2 size={14} />
            <span>Flip H</span>
          </button>
          <button
            type="button"
            className={cn('flip-btn', player.flipY && 'is-active')}
            aria-pressed={player.flipY}
            title="Flip portrait vertically"
            onClick={() => setPlayerConfig(index, { flipY: !player.flipY })}
          >
            <FlipVertical2 size={14} />
            <span>Flip V</span>
          </button>
          {(player.flipX || player.flipY) && (
            <button
              type="button"
              className="flip-btn flip-btn--reset"
              title="Reset portrait orientation"
              onClick={() => setPlayerConfig(index, { flipX: false, flipY: false })}
            >
              <RotateCcw size={13} />
              <span>Normal</span>
            </button>
          )}
        </div>
      </Field>

      <Field label="Portrait" hint="PNG / JPG / WEBP · up to 8 MB">
        <ImagePickControl
          assetId={player.portraitAssetId}
          kind="portrait"
          label="Portrait"
          onChange={(id) => setPlayerConfig(index, { portraitAssetId: id })}
        />
      </Field>

      <Field label="Country flag image" hint="optional — replaces the code badge">
        <ImagePickControl
          assetId={player.flagAssetId}
          kind="flag"
          label="Flag"
          pixel
          onChange={(id) => setPlayerConfig(index, { flagAssetId: id })}
        />
      </Field>

      <p className="panel-note">
        <Flag size={12} /> The portrait is frameless and the same picture is used everywhere on the
        broadcast. Upload photos once in the Assets tab (“Player photos” folder) and pick them here.
      </p>
    </Panel>
  );
}

/** Shared scoreboard-portrait presentation controls. */
function PortraitPresentation() {
  const { state, setSettings } = useStore();
  const scale = state.settings.portraitScale;

  return (
    <Panel title="Scoreboard portrait" icon={<ImageIcon size={15} />}>
      <Field label="Portrait scale" hint="frameless photo size on the overlay — applies to both players">
        <Slider
          value={scale}
          min={0.6}
          max={1.5}
          step={0.05}
          onChange={(v) => setSettings({ portraitScale: v })}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Field>
      <p className="panel-note">
        <ImageIcon size={12} /> Portraits render without a frame — the photo fills its slot with a
        thin outline for readability. Flip each player's photo with the Flip H / Flip V buttons.
      </p>
    </Panel>
  );
}

export function PlayersTab() {
  return (
    <div className="tab-body">
      <PortraitPresentation />
      <div className="players-grid">
        <PlayerEditor index={0} />
        <PlayerEditor index={1} />
      </div>
    </div>
  );
}
