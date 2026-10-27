/** The butterflies and fireflies feel every burst of signal loss (lib/effects.ts) as a short
 * earthquake: they are shoved off course, shake, flicker and beat their wings fast until it
 * passes. `quakeFlyers` is called by the burst itself; the flyers read the state each frame. */

const QUAKE_MS = 420;
let until = 0;
let count = 0;

export function quakeFlyers(): void {
  until = performance.now() + QUAKE_MS;
  count += 1;
}

/** Whether a quake is shaking the flyers at this moment. */
export function quaking(now: number): boolean {
  return now < until;
}

/** Which quake it is, so each flyer can take its one shove per quake. */
export function quakeCount(): number {
  return count;
}
