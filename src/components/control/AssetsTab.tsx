import {
  Crown,
  Flag,
  FolderOpen,
  Image as ImageIcon,
  ImagePlus,
  Heart,
  Shapes,
  Square,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { useState } from 'react';
import type { AssetMeta, AssetSlotId, PlayerIndex } from '../../types';
import { useStore } from '../../state/store';
import { pickFile } from '../../utils/pickFile';
import { AssetImage } from '../common/AssetImage';
import { Btn, Panel } from '../ui/kit';
import { cn } from '../../utils/cn';

/**
 * ASSET LIBRARY — two labelled folders:
 *   • PLAYER PHOTOS — portraits only. They can be assigned to the two
 *     scoreboard portrait slots (→ P1 / → P2); nothing else consumes them.
 *   • ASSETS — fixed broadcast slots (totem icon, tournament logo,
 *     background, custom item slots) plus the two player flags.
 * Every slot starts EMPTY; nothing is auto-generated. The operator uploads
 * their own artwork via the file browser (PNG / JPG / WEBP).
 */

interface SlotDef {
  id: AssetSlotId;
  label: string;
  hint: string;
  icon: React.ReactNode;
  shape: 'square' | 'wide';
}

const SLOTS: SlotDef[] = [
  { id: 'totemIcon', label: 'Totem of Undying', hint: 'item icon · empty by design until you upload', icon: <Heart size={18} />, shape: 'square' },
  { id: 'tournamentLogo', label: 'Tournament logo', hint: 'shown above the match clock', icon: <Crown size={18} />, shape: 'wide' },
  { id: 'background', label: 'Background graphic', hint: 'optional art behind the board', icon: <Shapes size={18} />, shape: 'wide' },
  { id: 'itemSlot1', label: 'Custom item slot 1', hint: 'extra Minecraft item artwork', icon: <Square size={18} />, shape: 'square' },
  { id: 'itemSlot2', label: 'Custom item slot 2', hint: 'extra Minecraft item artwork', icon: <Square size={18} />, shape: 'square' },
  { id: 'itemSlot3', label: 'Custom item slot 3', hint: 'extra Minecraft item artwork', icon: <Square size={18} />, shape: 'square' },
];

/** ---------------------------------------------------------------------------
 * PLAYER PHOTOS FOLDER — portrait-kind images with direct P1 / P2 assign.
 * ------------------------------------------------------------------------- */
function PhotoCard({ meta }: { meta: AssetMeta }) {
  const { state, setPlayerConfig, removeAsset } = useStore();
  const assignedTo = (index: PlayerIndex) => state.players[index].portraitAssetId === meta.id;

  const remove = async () => {
    await removeAsset(meta.id); // store also unassigns it from players
  };

  return (
    <div className="slot-card slot-card--square slot-card--filled photo-card">
      <div className="slot-preview">
        <AssetImage assetId={meta.id} alt={meta.name} className="slot-img" />
      </div>
      <div className="slot-meta">
        <span className="slot-label" title={meta.name}>{meta.name}</span>
        <span className="slot-hint">portrait photo</span>
        <div className="slot-actions">
          <Btn
            size="sm"
            variant={assignedTo(0) ? 'primary' : 'default'}
            icon={<UserRound size={13} />}
            onClick={() => setPlayerConfig(0, { portraitAssetId: meta.id })}
            title="Use as Player One portrait"
          >
            → P1
          </Btn>
          <Btn
            size="sm"
            variant={assignedTo(1) ? 'primary' : 'default'}
            icon={<UserRound size={13} />}
            onClick={() => setPlayerConfig(1, { portraitAssetId: meta.id })}
            title="Use as Player Two portrait"
          >
            → P2
          </Btn>
          <Btn size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => void remove()}>
            Delete
          </Btn>
        </div>
      </div>
    </div>
  );
}

export function PlayerPhotosFolder() {
  const { importAsset, state } = useStore();
  const [error, setError] = useState<string | null>(null);
  const photos = state.assetsMeta.filter((m) => m.kind === 'portrait');

  const upload = async () => {
    setError(null);
    const file = await pickFile();
    if (!file) return;
    try {
      await importAsset(file, 'portrait');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  return (
    <Panel title="Player photos" icon={<FolderOpen size={15} />}>
      <p className="panel-note">
        <ImageIcon size={12} /> Portrait photos only — assign them to the scoreboard with the
        → P1 / → P2 buttons. They are never used for anything else.
      </p>
      <div className="folder-toolbar">
        <Btn variant="primary" icon={<Upload size={14} />} onClick={() => void upload()}>
          Upload photo
        </Btn>
        {error ? <span className="slot-error">{error}</span> : null}
      </div>
      {photos.length === 0 ? (
        <div className="lib-empty">
          <ImageIcon size={26} />
          <p>No photos yet — upload the players' portrait pictures to fill this folder.</p>
        </div>
      ) : (
        <div className="slots-grid">
          {photos.map((meta) => (
            <PhotoCard key={meta.id} meta={meta} />
          ))}
        </div>
      )}
    </Panel>
  );
}

/** ---------------------------------------------------------------------------
 * ASSETS FOLDER — fixed broadcast slots.
 * ------------------------------------------------------------------------- */

function SlotCard({ def }: { def: SlotDef }) {
  const { state, importAsset, removeAsset, setSlotAsset } = useStore();
  const assetId = state.assets[def.id];
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    setError(null);
    const file = await pickFile();
    if (!file) return;
    try {
      // Replace: remove the previous asset when swapping in a new one.
      const prev = assetId;
      const id = await importAsset(file, def.id === 'tournamentLogo' ? 'logo' : def.id === 'background' ? 'background' : 'icon', {
        slot: def.id,
        name: def.label,
      });
      if (prev && prev !== id) await removeAsset(prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  const remove = async () => {
    if (!assetId) return;
    setSlotAsset(def.id, null);
    await removeAsset(assetId);
  };

  return (
    <div className={cn('slot-card', `slot-card--${def.shape}`, assetId && 'slot-card--filled')}>
      <div className="slot-preview">
        <AssetImage
          assetId={assetId}
          className="slot-img"
          pixel
          fallbackIcon={def.icon}
          fallbackLabel="EMPTY SLOT"
        />
      </div>
      <div className="slot-meta">
        <span className="slot-label">{def.label}</span>
        <span className="slot-hint">{def.hint}</span>
        <div className="slot-actions">
          <Btn size="sm" variant={assetId ? 'default' : 'primary'} icon={assetId ? <ImagePlus size={13} /> : <Upload size={13} />} onClick={() => void upload()}>
            {assetId ? 'Replace' : 'Upload'}
          </Btn>
          {assetId && (
            <Btn size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => void remove()}>
              Remove
            </Btn>
          )}
        </div>
        {error ? <span className="slot-error">{error}</span> : null}
      </div>
    </div>
  );
}

/** Flag slots map onto each player's config (P1 / P2). */
function FlagSlot({ index }: { index: 0 | 1 }) {
  const { state, importAsset, setPlayerConfig } = useStore();
  const player = state.players[index];
  const [error, setError] = useState<string | null>(null);

  const upload = async () => {
    setError(null);
    const file = await pickFile();
    if (!file) return;
    try {
      const id = await importAsset(file, 'flag', { name: `Flag P${index + 1}` });
      setPlayerConfig(index, { flagAssetId: id });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  return (
    <div className={cn('slot-card slot-card--square', player.flagAssetId && 'slot-card--filled')}>
      <div className="slot-preview">
        <AssetImage
          assetId={player.flagAssetId}
          className="slot-img"
          pixel
          fallbackIcon={<Flag size={18} />}
          fallbackLabel="EMPTY SLOT"
        />
      </div>
      <div className="slot-meta">
        <span className="slot-label">{`Player ${index + 1} flag`}</span>
        <span className="slot-hint">{`replaces the “${player.country || '—'}” code badge`}</span>
        <div className="slot-actions">
          <Btn size="sm" variant={player.flagAssetId ? 'default' : 'primary'} icon={<Upload size={13} />} onClick={() => void upload()}>
            {player.flagAssetId ? 'Replace' : 'Upload'}
          </Btn>
          {player.flagAssetId && (
            <Btn size="sm" variant="ghost" icon={<Trash2 size={13} />} onClick={() => setPlayerConfig(index, { flagAssetId: null })}>
              Remove
            </Btn>
          )}
        </div>
        {error ? <span className="slot-error">{error}</span> : null}
      </div>
    </div>
  );
}

export function AssetsFolder() {
  return (
    <Panel title="Assets" icon={<FolderOpen size={15} />}>
      <p className="panel-note">
        <Heart size={12} /> Fixed broadcast slots — all ship intentionally empty, no placeholder
        artwork is generated. Use transparent PNGs for icons; recommended 128×128 or larger.
      </p>
      <div className="slots-grid">
        {SLOTS.map((def) => (
          <SlotCard key={def.id} def={def} />
        ))}
      </div>
    </Panel>
  );
}

export function AssetsTab() {
  return (
    <div className="tab-body">
      <PlayerPhotosFolder />
      <AssetsFolder />
      <Panel title="Player flags" icon={<Flag size={15} />}>
        <div className="slots-grid">
          <FlagSlot index={0} />
          <FlagSlot index={1} />
        </div>
      </Panel>
    </div>
  );
}
