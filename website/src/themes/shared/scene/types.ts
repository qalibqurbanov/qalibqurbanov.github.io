export type Rgb = [number, number, number];

/** What a scene is given on every frame. Everything is in CSS pixels unless noted. */
export interface SceneEnv {
  /** The viewport size. */
  w: number;
  h: number;
  /** Device pixel ratio the canvas is drawn at (capped). */
  dpr: number;
  /** Seconds since the scene started, and since the previous frame (held back to a sensible step). */
  t: number;
  dt: number;
  /** The pointer, eased so it glides: use for anything that should follow it. */
  mx: number;
  my: number;
  /** The pointer exactly where it is, its speed in px per second, and whether it has been seen yet. */
  rx: number;
  ry: number;
  vx: number;
  vy: number;
  seen: boolean;
  /** How far the page has scrolled, and how far it can. */
  scrollY: number;
  scrollMax: number;
  /** The light colour mode is on. */
  light: boolean;
  /** The page's current colours (the colour scheme, or the theme's own). */
  bg: Rgb;
  text: Rgb;
  accent: Rgb;
  accent2: Rgb;
  /** The animation level is "off": one still frame is drawn, and again when something changes. */
  still: boolean;
  /** The animation level is "full" (and not "light"). */
  full: boolean;
}

/** A theme's living background. */
export interface Scene {
  frame(env: SceneEnv): void;
  /** The viewport changed size; the canvas has already been resized. */
  resize?(env: SceneEnv): void;
  /** A press somewhere in the viewport. */
  press?(x: number, y: number, env: SceneEnv): void;
  destroy?(): void;
}

/** `canvas` is the backdrop (the atmosphere); `objects` is a second canvas above it, still behind the page,
 * for the objects scattered through the page. */
export type SceneFactory = (canvas: HTMLCanvasElement, env: SceneEnv, objects: HTMLCanvasElement, models: HTMLCanvasElement) => Scene;
