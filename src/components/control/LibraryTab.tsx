import { useMemo, useState } from 'react';
import { Pencil, Search, Trash2, UserPlus, Users } from 'lucide-react';
import type { PlayerIndex, PlayerProfile } from '../../types';
import { useStore } from '../../state/store';
import { AssetImage } from '../common/AssetImage';
import { Btn, Panel, TextInput } from '../ui/kit';
import { Modal } from '../ui/Modal';
import { useConfirm } from '../ui/Modal';
import { ImagePickControl } from './ImagePickControl';

/**
 * PLAYER IMAGE LIBRARY — reusable competitor profiles with portraits.
 * No artificial / generated players: the library starts empty and is
 * populated purely by the operator's own uploads and inputs.
 */

function ProfileModal({
  open,
  editing,
  onClose,
}: {
  open: boolean;
  editing: PlayerProfile | null;
  onClose: () => void;
}) {
  const { saveProfile, setPlayerConfig } = useStore();
  const [name, setName] = useState(editing?.name ?? '');
  const [country, setCountry] = useState(editing?.country ?? '');
  const [portrait, setPortrait] = useState<string | null>(editing?.portraitAssetId ?? null);
  const [altPortrait, setAltPortrait] = useState<string | null>(editing?.altPortraitAssetId ?? null);

  const save = (assignTo?: PlayerIndex) => {
    const profile = saveProfile({
      id: editing?.id,
      name,
      country,
      portraitAssetId: portrait,
      altPortraitAssetId: altPortrait,
    });
    if (assignTo !== undefined) {
      setPlayerConfig(assignTo, {
        name: profile.name,
        country: profile.country,
        portraitAssetId: profile.portraitAssetId,
        altPortraitAssetId: profile.altPortraitAssetId,
      });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit player profile' : 'New player profile'}
      width={560}
    >
      <div className="profile-form">
        <label className="profile-field">
          <span>Name</span>
          <TextInput
            value={name}
            maxLength={24}
            placeholder="PLAYER NAME"
            onChange={(e) => setName(e.target.value.toUpperCase())}
          />
        </label>
        <label className="profile-field">
          <span>Country code</span>
          <TextInput
            value={country}
            maxLength={3}
            placeholder="—"
            className="text-input--code"
            onChange={(e) => setCountry(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          />
        </label>
        <div className="profile-field">
          <span>Portrait</span>
          <ImagePickControl
            assetId={portrait}
            kind="portrait"
            label="Portrait"
            onChange={setPortrait}
          />
        </div>
        <div className="profile-field">
          <span>Alternate portrait</span>
          <ImagePickControl
            assetId={altPortrait}
            kind="portrait"
            label="Alt portrait"
            onChange={setAltPortrait}
          />
        </div>
        <div className="profile-form-actions">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={() => save()}>
            Save profile
          </Btn>
        </div>
        <div className="profile-assign">
          <span>Save &amp; assign to:</span>
          <Btn size="sm" onClick={() => save(0)}>
            Player One
          </Btn>
          <Btn size="sm" onClick={() => save(1)}>
            Player Two
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

export function LibraryTab() {
  const { state, deleteProfile, setPlayerConfig } = useStore();
  const confirm = useConfirm();
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<{ open: boolean; editing: PlayerProfile | null }>({
    open: false,
    editing: null,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...state.profiles].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return list;
    return list.filter((p) => p.name.toLowerCase().includes(q) || p.country.toLowerCase().includes(q));
  }, [state.profiles, query]);

  const remove = async (profile: PlayerProfile) => {
    const ok = await confirm({
      title: `Delete ${profile.name}?`,
      message: 'The profile is removed from the library. Uploaded images stay in your asset library.',
      confirmLabel: 'Delete profile',
      danger: true,
    });
    if (ok) deleteProfile(profile.id);
  };

  const assign = (profile: PlayerProfile, index: PlayerIndex) => {
    setPlayerConfig(index, {
      name: profile.name,
      country: profile.country,
      portraitAssetId: profile.portraitAssetId,
      altPortraitAssetId: profile.altPortraitAssetId,
    });
  };

  return (
    <div className="tab-body">
      <Panel
        title="Player library"
        icon={<Users size={15} />}
        actions={
          <Btn
            size="sm"
            variant="primary"
            icon={<UserPlus size={13} />}
            onClick={() => setModal({ open: true, editing: null })}
          >
            New player
          </Btn>
        }
      >
        <div className="lib-search">
          <Search size={14} />
          <TextInput
            value={query}
            placeholder="Search players by name…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="lib-empty">
            <Users size={26} />
            <p>
              {state.profiles.length === 0
                ? 'No saved players yet. Create a profile to reuse portraits and names across matches.'
                : 'No players match your search.'}
            </p>
          </div>
        ) : (
          <div className="lib-grid">
            {filtered.map((profile) => (
              <div key={profile.id} className="lib-card">
                <div className="lib-portrait">
                  <AssetImage
                    assetId={profile.portraitAssetId}
                    alt={profile.name}
                    className="lib-img"
                    fallbackLabel="NO PORTRAIT"
                  />
                </div>
                <div className="lib-info">
                  <span className="lib-name">{profile.name}</span>
                  <span className="lib-country">{profile.country || '—'}</span>
                </div>
                <div className="lib-actions">
                  <Btn size="sm" onClick={() => assign(profile, 0)} title="Assign to Player One">
                    → P1
                  </Btn>
                  <Btn size="sm" onClick={() => assign(profile, 1)} title="Assign to Player Two">
                    → P2
                  </Btn>
                </div>
                <div className="lib-manage">
                  <button
                    type="button"
                    className="icon-mini"
                    title="Edit profile"
                    onClick={() => setModal({ open: true, editing: profile })}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="icon-mini icon-mini--danger"
                    title="Delete profile"
                    onClick={() => void remove(profile)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {modal.open && (
        <ProfileModalBridge
          key={modal.editing?.id ?? 'new'}
          editing={modal.editing}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}
    </div>
  );
}

/** Re-mounts the modal fresh for each open (name state resets). */
function ProfileModalBridge({
  editing,
  onClose,
}: {
  editing: PlayerProfile | null;
  onClose: () => void;
}) {
  return <ProfileModal open editing={editing} onClose={onClose} />;
}
