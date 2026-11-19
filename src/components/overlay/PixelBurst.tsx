import { cn } from '../../utils/cn';

/**
 * Pixel-inspired particle burst (Minecraft item-break feel).
 * Deterministic pattern — no random motion, so replays look identical
 * and stay smooth under OBS encoding load. Remounting via `burstKey`
 * replays the burst.
 */

interface Particle {
  dx: number;
  dy: number;
  s: number;
  c: string;
}

const PALETTE = ['#B56BFF', '#8B5CF6', '#63E6BE', '#E9E5F0'];

/** 10-particle radial burst used for totem consumption + victories. */
export const BURST: Particle[] = [
  { dx: -30, dy: -18, s: 7, c: PALETTE[0] },
  { dx: 26, dy: -26, s: 6, c: PALETTE[1] },
  { dx: -16, dy: -34, s: 5, c: PALETTE[2] },
  { dx: 34, dy: -6, s: 6, c: PALETTE[0] },
  { dx: -36, dy: 6, s: 5, c: PALETTE[3] },
  { dx: 14, dy: -40, s: 4, c: PALETTE[2] },
  { dx: 28, dy: 16, s: 6, c: PALETTE[1] },
  { dx: -24, dy: 20, s: 5, c: PALETTE[0] },
  { dx: 4, dy: -46, s: 5, c: PALETTE[3] },
  { dx: 38, dy: -20, s: 4, c: PALETTE[2] },
];

export function PixelBurst({
  burstKey,
  scale = 1,
  className,
}: {
  burstKey: number | string;
  scale?: number;
  className?: string;
}) {
  return (
    <div key={burstKey} className={cn('px-burst', className)} aria-hidden>
      {BURST.map((p, i) => (
        <span
          key={i}
          className="px-part"
          style={
            {
              width: p.s * scale,
              height: p.s * scale,
              background: p.c,
              '--dx': `${p.dx * scale}px`,
              '--dy': `${p.dy * scale}px`,
              animationDelay: `${(i % 4) * 35}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
