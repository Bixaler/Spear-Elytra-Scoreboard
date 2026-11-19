import { useEffect, useState } from 'react';
import { resolveImage } from '../state/imageStore';

/**
 * Resolve an IndexedDB asset id into an object URL.
 * Returns null while unresolved / missing — callers render placeholders.
 */
export function useAssetUrl(assetId: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(() =>
    assetId ? null : null
  );

  useEffect(() => {
    let alive = true;
    if (!assetId) {
      setUrl(null);
      return;
    }
    resolveImage(assetId).then((resolved) => {
      if (alive) setUrl(resolved ? resolved.url : null);
    });
    return () => {
      alive = false;
    };
  }, [assetId]);

  return url;
}
