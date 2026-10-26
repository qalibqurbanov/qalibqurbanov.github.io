/** Small number helpers shared by the page's effects. */

/** A random number from `min` up to (not including) `max`. */
export const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** `v`, held between `min` and `max`. */
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** -1 or 1, each as likely. */
export const sign = () => (Math.random() < 0.5 ? -1 : 1);

/** An angle brought into -π to π, so the difference between two headings is the short way round. */
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** 0 → 1 with a soft start and end. */
export const smooth = (t: number) => {
  const k = clamp(t, 0, 1);
  return k * k * (3 - 2 * k);
};

/** 0 → 1, fast at first and settling gently. */
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
