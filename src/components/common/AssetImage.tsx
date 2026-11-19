import { useState, type ReactNode } from 'react';
import { ImageOff } from 'lucide-react';
import { useAssetUrl } from '../../hooks/useAssetUrl';
import { cn } from '../../utils/cn';

/**
 * Renders an IndexedDB-backed image with graceful fallback.
 * Missing / invalid assets never crash the UI — they render a labelled
 * empty placeholder instead.
 */
export function AssetImage({
  assetId,
  alt,
  className,
  fallbackIcon,
  fallbackLabel,
  pixel,
}: {
  assetId: string | null | undefined;
  alt?: string;
  className?: string;
  fallbackIcon?: ReactNode;
  fallbackLabel?: string;
  /** Apply image-rendering: pixelated (for Minecraft-style pixel art). */
  pixel?: boolean;
}) {
  const url = useAssetUrl(assetId);
  const [failed, setFailed] = useState(false);

  if (!assetId || !url || failed) {
    return (
      <div className={cn('asset-empty', className)} title="No image assigned">
        {fallbackIcon ?? <ImageOff size={14} />}
        {fallbackLabel ? <span>{fallbackLabel}</span> : null}
      </div>
    );
  }

  return (
    <img
      className={cn('asset-img', pixel && 'asset-img--pixel', className)}
      src={url}
      alt={alt ?? ''}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
