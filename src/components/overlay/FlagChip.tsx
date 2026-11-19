import type { PlayerConfig } from '../../types';
import { AssetImage } from '../common/AssetImage';
import { cn } from '../../utils/cn';

/**
 * Country flag: an uploaded flag image when assigned, otherwise a compact
 * code badge. Renders nothing when the player has no country at all.
 */
export function FlagChip({ player, className }: { player: PlayerConfig; className?: string }) {
  if (!player.flagAssetId && !player.country) return null;

  return (
    <span className={cn('flag-chip', player.flagAssetId && 'flag-chip--img', className)}>
      {player.flagAssetId ? (
        <AssetImage assetId={player.flagAssetId} alt={player.country} className="flag-img" />
      ) : (
        <span className="flag-code">{player.country.toUpperCase()}</span>
      )}
    </span>
  );
}
