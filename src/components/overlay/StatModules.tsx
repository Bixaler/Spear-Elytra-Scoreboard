import { useEffect, useRef, useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { PlayerScore, Settings } from '../../types';
import { AssetImage } from '../common/AssetImage';
import { AnimatedNumber } from './AnimatedNumber';
import { PixelBurst } from './PixelBurst';
import { cn } from '../../utils/cn';

/**
 * The three broadcast statistics. Each is a completely separate component
 * bound to its own score field — they never share or derive state.
 *
 * BOARD ORDER (swapped by operator request):
 *   1. ROUNDS WON  — the big primary plate (number dead-centre in its box)
 *   2. DUEL WINS   — compact secondary counter next to the Totem slot
 *   3. TOTEM       — dedicated inventory-slot area
 * No icon artwork is shown for Rounds / Duel wins — numbers only.
 */

// ---------------------------------------------------------------------------
// 1. ROUNDS WON — big primary plate, number anchored to the exact centre
// ---------------------------------------------------------------------------

export function StatRounds({
  score,
  settings,
}: {
  score: PlayerScore;
  settings: Settings;
}) {
  return (
    <div className="stat-rounds">
      <span className="stat-rounds-label">ROUNDS WON</span>
      <div className="stat-rounds-num">
        <AnimatedNumber value={score.roundsWon} settings={settings} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. DUEL WINS — compact secondary counter in the sub-row
// ---------------------------------------------------------------------------

export function StatDuel({
  score,
  settings,
}: {
  score: PlayerScore;
  settings: Settings;
}) {
  return (
    <div className="stat-duel">
      <div className="stat-duel-num">
        <AnimatedNumber value={score.duelWins} settings={settings} />
      </div>
      <span className="stat-duel-label">DUEL WINS</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. TOTEM OF UNDYING — dedicated inventory-slot area
//    (image slot left EMPTY until the operator uploads an icon)
// ---------------------------------------------------------------------------

type TotemFx = 'consume' | 'gain' | null;

export function TotemSlot({
  score,
  settings,
  iconAssetId,
}: {
  score: PlayerScore;
  settings: Settings;
  iconAssetId: string | null;
}) {
  const prevRef = useRef(score.totems);
  const [fx, setFx] = useState<TotemFx>(null);

  // Watch for changes and pick the matching effect: consumption gets the
  // pixel-burst + slot shake, acquisition gets a short glowing ring.
  useEffect(() => {
    if (score.totems === prevRef.current) return;
    const next: TotemFx = score.totems < prevRef.current ? 'consume' : 'gain';
    prevRef.current = score.totems;
    setFx(next);
    const t = window.setTimeout(() => setFx(null), 700);
    return () => window.clearTimeout(t);
  }, [score.totems]);

  return (
    <div className={cn('totem', fx && `totem--${fx}`)}>
      <div className="totem-slot">
        <AssetImage
          assetId={iconAssetId}
          pixel
          className="totem-img"
          fallbackIcon={<ImageOff size={14} />}
        />
        <span className="totem-badge">{score.totems}</span>
        {fx === 'consume' && settings.intensity !== 'minimal' && (
          <PixelBurst burstKey={`${score.totems}-consume`} scale={0.85} className="totem-burst" />
        )}
        {fx === 'gain' && settings.intensity !== 'minimal' && (
          <span className="totem-ring" aria-hidden />
        )}
      </div>
      <div className="totem-side">
        <span className="totem-label">TOTEM</span>
        <div className="totem-count">
          <AnimatedNumber value={score.totems} settings={settings} />
        </div>
      </div>
    </div>
  );
}
