import { ImageOff } from 'lucide-react';
import type { PlayerConfig } from '../../types';
import { AssetImage } from '../common/AssetImage';
import { cn } from '../../utils/cn';

/**
 * FRAMELESS player portrait — the photo fills its container edge-to-edge
 * with only a hairline outline for readability on bright gameplay.
 * No frame chrome, no corners. Missing portraits render a labelled
 * silhouette placeholder — never a generated face.
 */
export function PortraitFrame({
  player,
  className,
}: {
  player: PlayerConfig;
  className?: string;
}) {
  return (
    <div className={cn('pf', className)}>
      <div className={cn('pf-inner', player.flipX && 'is-flipx', player.flipY && 'is-flipy')}>
        {player.portraitAssetId ? (
          <AssetImage
            assetId={player.portraitAssetId}
            alt={`${player.name} portrait`}
            className="pf-img"
          />
        ) : (
          <div className="pf-empty">
            <ImageOff size={20} />
            <span>NO PORTRAIT</span>
          </div>
        )}
      </div>
    </div>
  );
}
