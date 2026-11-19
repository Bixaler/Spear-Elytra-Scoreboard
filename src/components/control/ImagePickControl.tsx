import { useState } from 'react';
import { Image as ImageIcon, Library, Trash2, Upload } from 'lucide-react';
import type { AssetKind, AssetMeta } from '../../types';
import { useStore } from '../../state/store';
import { pickFile } from '../../utils/pickFile';
import { AssetImage } from '../common/AssetImage';
import { Btn } from '../ui/kit';
import { AssetPickerModal } from './AssetPickerModal';
import { cn } from '../../utils/cn';

/**
 * Reusable "assign an image" control: shows the current image, and offers
 * Upload (file browser) / Library (pick an already-uploaded asset) /
 * Remove. Used for portraits, alternate portraits and flags.
 */
export function ImagePickControl({
  assetId,
  kind,
  label,
  pixel,
  onChange,
  className,
}: {
  assetId: string | null;
  kind: AssetKind;
  label: string;
  pixel?: boolean;
  onChange: (assetId: string | null) => void;
  className?: string;
}) {
  const { importAsset, state } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const options: AssetMeta[] = state.assetsMeta.filter((m) => m.kind === kind);

  const upload = async () => {
    setError(null);
    const file = await pickFile();
    if (!file) return;
    try {
      const id = await importAsset(file, kind);
      onChange(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  return (
    <div className={cn('img-pick', className)}>
      <div className="img-pick-preview">
        <AssetImage
          assetId={assetId}
          pixel={pixel}
          fallbackIcon={<ImageIcon size={16} />}
          fallbackLabel="EMPTY"
        />
      </div>
      <div className="img-pick-actions">
        <div className="img-pick-row">
          <Btn size="sm" icon={<Upload size={13} />} onClick={upload}>
            Upload
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            icon={<Library size={13} />}
            onClick={() => setPickerOpen(true)}
            disabled={options.length === 0}
          >
            Library
          </Btn>
          <Btn
            size="sm"
            variant="ghost"
            icon={<Trash2 size={13} />}
            onClick={() => onChange(null)}
            disabled={!assetId}
            title="Unassign image"
          >
            Clear
          </Btn>
        </div>
        {error ? <span className="img-pick-error">{error}</span> : null}
      </div>

      <AssetPickerModal
        open={pickerOpen}
        kind={kind}
        onClose={() => setPickerOpen(false)}
        onPick={(id) => {
          onChange(id);
          setPickerOpen(false);
        }}
        onUpload={async () => {
          const file = await pickFile();
          if (!file) return null;
          try {
            return await importAsset(file, kind);
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Upload failed.');
            return null;
          }
        }}
      />
    </div>
  );
}
