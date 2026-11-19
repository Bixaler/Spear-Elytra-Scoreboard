import { Upload } from 'lucide-react';
import type { AssetKind, AssetMeta } from '../../types';
import { useStore } from '../../state/store';
import { AssetImage } from '../common/AssetImage';
import { Modal } from '../ui/Modal';
import { Btn } from '../ui/kit';

/**
 * Pick an image from the assets already uploaded for a given kind
 * (e.g. every portrait in the library), with an inline upload button.
 */
export function AssetPickerModal({
  open,
  kind,
  onClose,
  onPick,
  onUpload,
}: {
  open: boolean;
  kind: AssetKind;
  onClose: () => void;
  onPick: (assetId: string) => void;
  onUpload: () => Promise<string | null>;
}) {
  const { state } = useStore();
  const options: AssetMeta[] = state.assetsMeta.filter((m) => m.kind === kind);

  return (
    <Modal open={open} onClose={onClose} title={`Choose ${kind}`} width={560}>
      <div className="picker-grid">
        <Btn
          variant="primary"
          icon={<Upload size={14} />}
          className="picker-upload"
          onClick={() => void onUpload()}
        >
          Upload new image
        </Btn>
        {options.map((meta) => (
          <button
            key={meta.id}
            type="button"
            className="picker-item"
            onClick={() => onPick(meta.id)}
            title={meta.name}
          >
            <AssetImage assetId={meta.id} alt={meta.name} className="picker-thumb" />
            <span className="picker-name">{meta.name}</span>
          </button>
        ))}
        {options.length === 0 && (
          <p className="picker-empty">Nothing uploaded for “{kind}” yet — upload an image first.</p>
        )}
      </div>
    </Modal>
  );
}
