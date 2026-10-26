/** Flight model for the cyber butterfly. It lives in *document* coordinates:
 * it roams the whole page, so scrolling moves the page past it instead of the
 * butterfly following the screen.
 *
 * The flight is built to be smooth. There is a heading and a speed; the
 * heading changes through a turn *rate* that itself eases in and out, so a new
 * goal becomes a wide, rounded arc and never a snap. New goals are picked a
 * few hundred pixels ahead of where it is already heading, anywhere on the
 * page (not near the visible part), so it drifts about on its own and is only
 * seen when its wandering happens to cross the screen. Now and then it
 * dawdles almost in place or slips off the side of the page and comes back. */

import { clamp, rand, smooth, wrapAngle } from "@/lib/math";


export interface View {
  /** Page width and the visible height. */
  w: number;
  h: number;
  scrollY: number;
  /** Full height of the document. */
  docH: number;
}

type Mode = "fly" | "hover" | "away" | "land" | "hang" | "orbit";

/** The point on the page it hangs from, in document coordinates; null once it is gone. */
export type Perch = () => { x: number; y: number } | null;
/** Picks something to hang from near a point of the page, if anything suits. */
export type PerchFinder = (x: number, y: number) => Perch | null;

/** How long a butterfly stays hanging, in seconds. */
const HANG_MIN = 15;
const HANG_MAX = 30;
/** The thread lets go over this long after take-off. */
const THREAD_FADE = 0.9;

export class ButterflyFlight {
  x = 0;
  y = 0;
  /** Heading of travel in radians (0 = to the right). */
  heading = 0;
  speed = 0;
  /** Smoothed rotation for drawing: 0 = facing up. */
  angle = 0;
  /** A small vertical bob, for drawing only. */
  bob = 0;
  /** 0 = wings flapping, 1 = wings folded for hanging; eases both ways. */
  fold = 0;
  /** Where the thread is fixed, and how visible it is (0 = none). */
  anchorX = 0;
  anchorY = 0;
  threadAlpha = 0;
  /** When set (document coordinates), it leaves what it is doing and circles this point. */
  orbit: { x: number; y: number } | null = null;

  private readonly size: number;
  private mode: Mode = "fly";
  private gx = 0;
  private gy = 0;
  private goalAge = 0;
  private timer = 0;
  private cruise = 120;
  /** Current turn rate in rad/s; it eases toward what the goal asks for. */
  private turn = 0;
  private t = rand(0, 100);
  private readonly pA = rand(0, 6.28);
  private readonly pB = rand(0, 6.28);
  private readonly pC = rand(0, 6.28);

  /** Set by the owner; without it the butterfly never lands. */
  finder: PerchFinder | null = null;
  private perch: Perch | null = null;
  private hangT = 0;
  private swing = 0;
  private swingPhase = 0;
  /** What is left of the approach: an offset from the hanging point and its velocity, damped to zero. */
  private resid = { x: 0, y: 0 };
  private residV = { x: 0, y: 0 };
  private fade = 0;
  private oAng = 0;
  private oSpin = 0.8;
  private oRadius = 120;

  constructor(size: number, view: View) {
    this.size = size;
    this.respawn(view);
  }

  /** Length of the thread. */
  private get len(): number {
    return this.size * 1.05;
  }

  private reset(): void {
    this.perch = null;
    this.fold = 0;
    this.threadAlpha = 0;
    this.fade = 0;
  }

  /** Puts it just beyond a side of the page, level with the visible part, and sends it in. */
  respawn(view: View): void {
    this.reset();
    const fromLeft = Math.random() < 0.5;
    const pad = this.pad();
    this.x = fromLeft ? -pad : view.w + pad;
    this.y = view.scrollY + rand(view.h * 0.15, view.h * 0.85);
    this.heading = fromLeft ? rand(-0.5, 0.5) : Math.PI + rand(-0.5, 0.5);
    this.angle = this.heading + Math.PI / 2;
    this.speed = 110;
    this.turn = 0;
    this.mode = "fly";
    this.nextGoal(view, true);
  }

  /** Puts it somewhere random on the whole page, facing a random way, so
   * several butterflies never start out together or in step. */
  scatter(view: View): void {
    this.reset();
    this.x = rand(view.w * 0.1, view.w * 0.9);
    this.y = rand(60, Math.max(120, view.docH - 60));
    this.heading = rand(-Math.PI, Math.PI);
    this.angle = this.heading + Math.PI / 2;
    this.speed = rand(90, 150);
    this.turn = 0;
    this.mode = "fly";
    this.t = rand(0, 100);
    this.nextGoal(view, true);
  }

  /** True while it circles the idle cursor. */
  get orbiting(): boolean {
    return this.mode === "orbit";
  }

  /** True while it dangles from its thread. */
  get hanging(): boolean {
    return this.mode === "hang";
  }

  /** Flinches away from a point (the pointer): lets go of whatever it was doing and darts a
   * short way in the opposite direction. Returns false while it circles the cursor, which it won't leave. */
  startle(view: View, from: { x: number; y: number }): boolean {
    if (this.mode === "orbit") return false;
    if (this.mode === "hang") this.leave(view, true);
    else if (this.mode === "land") this.leave(view, false);
    const away = Math.atan2(this.y - from.y, this.x - from.x) + rand(-0.6, 0.6);
    const reach = rand(150, 230);
    this.gx = clamp(this.x + Math.cos(away) * reach, 20, view.w - 20);
    this.gy = clamp(this.y + Math.sin(away) * reach, 20, Math.max(40, view.docH - 20));
    this.mode = "fly";
    this.goalAge = 0;
    this.heading = Math.atan2(this.gy - this.y, this.gx - this.x);
    this.turn = 0;
    this.speed = Math.max(this.speed, 280);
    return true;
  }

  /** Gives up the approach, or lets go after hanging: it lifts off sideways and
   * a little upward, from a standstill, and the speed eases up from there. */
  private leave(view: View, fromHang: boolean): void {
    if (this.threadAlpha > 0.01) this.fade = THREAD_FADE * (fromHang ? 1 : this.threadAlpha);
    this.perch = null;
    this.mode = "fly";
    const side = Math.random() < 0.5 ? 1 : -1;
    this.heading = side > 0 ? -0.4 : Math.PI + 0.4;
    this.turn = 0;
    this.speed = Math.min(this.speed, 8);
    this.nextGoal(view, true);
  }

  update(dt: number, view: View, slow = 1): void {
    this.t += dt;
    this.goalAge += dt;

    // The thread letting go after take-off.
    if (this.fade > 0 && this.mode !== "hang" && this.mode !== "land") {
      this.fade = Math.max(0, this.fade - dt);
      this.threadAlpha = smooth(this.fade / THREAD_FADE);
    }

    // Called in to circle a point (the idle cursor), and let go again afterwards.
    if (this.orbit) {
      if (this.mode !== "orbit") this.enterOrbit(view, this.orbit);
    } else if (this.mode === "orbit") {
      this.mode = "fly";
      this.nextGoal(view, true);
    }

    if (this.mode === "hang") {
      this.updateHang(dt, view);
      return;
    }

    if (this.mode === "orbit" && this.orbit) {
      // The goal runs round a loose ellipse; each butterfly has its own radius, speed and direction.
      this.oAng += this.oSpin * dt;
      const rad = this.oRadius * (1 + 0.12 * Math.sin(this.t * 0.9 + this.pA));
      this.gx = this.orbit.x + Math.cos(this.oAng) * rad;
      this.gy = this.orbit.y + Math.sin(this.oAng) * rad * 0.72;
    }

    if (this.mode === "land") {
      const spot = this.perch?.();
      if (!spot || this.goalAge > 18) this.leave(view, false);
      else {
        this.anchorX = spot.x;
        this.anchorY = spot.y;
        this.gx = spot.x;
        this.gy = spot.y + this.len;
      }
    }

    const dist = Math.hypot(this.gx - this.x, this.gy - this.y);

    if (this.mode === "hover") {
      this.timer -= dt;
      if (this.timer <= 0) this.nextGoal(view, false);
    } else if (this.mode === "away") {
      this.timer -= dt;
      if (this.timer <= 0) this.nextGoal(view, true);
    } else if (this.mode === "land") {
      // The thread appears on the final approach and the wings start to fold.
      this.threadAlpha = smooth(1 - (dist - this.len) / (this.size * 3.5));
      if (dist < 6 && this.speed < 30) {
        this.mode = "hang";
        this.hangT = 0;
        this.timer = rand(HANG_MIN, HANG_MAX);
        this.swing = rand(0.2, 0.3);
        this.swingPhase = rand(0, Math.PI * 2);
        this.resid = { x: this.x - this.gx, y: this.y - this.gy };
        this.residV = { x: Math.cos(this.heading) * this.speed, y: Math.sin(this.heading) * this.speed };
        this.speed = 0;
        this.turn = 0;
        this.updateHang(dt, view);
        return;
      }
    } else if (this.mode === "fly" && (dist < 90 || this.goalAge > 12)) {
      this.nextGoal(view, false);
    }

    // Wings fold as it comes in to hang, and open again once it is flying.
    const foldGoal = this.mode === "land" ? smooth(1 - (dist - 30) / (this.size * 3.5)) : 0;
    this.fold += (foldGoal - this.fold) * Math.min(1, dt * 3);

    // Heading: a gentle wander on top of the way to the goal, followed through
    // a turn rate that eases in and out (no instant changes of direction).
    const toGoal = Math.atan2(this.gy - this.y, this.gx - this.x);
    const landing = this.mode === "land";
    const wander = landing ? 0 : Math.sin(this.t * 0.7 + this.pA) * 0.3 + Math.sin(this.t * 1.7 + this.pB) * 0.12;
    const swirl = this.mode === "hover" ? Math.sin(this.t * 1.2 + this.pC) * 0.6 : 0;
    const diff = wrapAngle(toGoal + wander + swirl - this.heading);
    const orbiting = this.mode === "orbit";
    const maxTurn = landing ? (dist < 110 ? 2.4 : 1.0) : orbiting ? 1.8 : this.mode === "hover" ? 1.1 : 0.85;
    const wanted = clamp(diff * (orbiting ? 1.6 : 1.1), -maxTurn, maxTurn);
    this.turn += (wanted - this.turn) * Math.min(1, dt * 2.2);
    this.heading += this.turn * dt;

    // Speed eases toward a target that dips in tighter turns; on landing it
    // slows steadily and arrives at a near standstill.
    const base = landing
      ? Math.min(this.cruise * 0.6, 10 + dist * 0.55)
      : orbiting
        ? Math.min(this.cruise * 2.4, Math.max(this.cruise * 0.55, dist * 1.4))
        : this.mode === "hover" ? 26 : this.cruise * (1 + 0.18 * Math.sin(this.t * 0.6 + this.pC));
    const turnPenalty = 1 - 0.4 * Math.min(1, Math.abs(diff) / Math.PI);
    const target = base * turnPenalty * (orbiting ? 1 : slow);
    this.speed += (target - this.speed) * Math.min(1, dt * (landing ? 1.8 : 1.2));

    this.x += Math.cos(this.heading) * this.speed * dt;
    this.y += Math.sin(this.heading) * this.speed * dt;

    // Never wander off for good: past the limits, pick a way back (it still
    // arcs round, because the turn rate is limited).
    const pad = this.pad() * 3;
    if (!orbiting && (this.x < -pad || this.x > view.w + pad || this.y < -pad || this.y > view.docH + pad)) this.nextGoal(view, true);

    this.angle += wrapAngle(this.heading + Math.PI / 2 - this.angle) * Math.min(1, dt * 2.5);
    this.bob = Math.sin(this.t * 6.3) * (1.5 + Math.min(3, this.speed * 0.02)) * (1 - this.fold);
  }

  /** Starts circling a point: gives up a landing or lets go of its thread first,
   * and joins the circle where it already is, so there is no jump. */
  private enterOrbit(view: View, at: { x: number; y: number }): void {
    if (this.mode === "hang") this.leave(view, true);
    else if (this.mode === "land") this.leave(view, false);
    this.mode = "orbit";
    this.oAng = Math.atan2(this.y - at.y, this.x - at.x);
    this.oSpin = (Math.random() < 0.5 ? -1 : 1) * rand(0.55, 1.0);
    this.oRadius = this.size * rand(1.6, 3.2) + 30;
    this.goalAge = 0;
  }

  /** Dangling from the thread: a pendulum whose swing builds up gently after
   * arriving, with any leftover offset from the approach dying away. */
  private updateHang(dt: number, view: View): void {
    const spot = this.perch?.();
    this.hangT += dt;
    this.timer -= dt;
    if (!spot || this.timer <= 0) {
      this.leave(view, true);
      return;
    }
    this.anchorX = spot.x;
    this.anchorY = spot.y;
    this.threadAlpha += (1 - this.threadAlpha) * Math.min(1, dt * 4);
    this.fold += (1 - this.fold) * Math.min(1, dt * 3);

    const ramp = smooth(this.hangT / 1.8);
    // Eases the swing out a little before letting go, so it does not jerk away.
    const calm = smooth(this.timer / 0.8);
    const theta = this.swing * ramp * calm * Math.sin(this.hangT * 2.2 + this.swingPhase);
    // A critically damped spring takes the arrival's momentum out gently.
    for (const axis of ["x", "y"] as const) {
      this.residV[axis] += (-9 * this.resid[axis] - 6 * this.residV[axis]) * dt;
      this.resid[axis] += this.residV[axis] * dt;
    }
    this.x = spot.x + Math.sin(theta) * this.len + this.resid.x;
    this.y = spot.y + Math.cos(theta) * this.len + this.resid.y;
    this.speed = 0;
    this.turn = 0;
    this.heading = -Math.PI / 2;
    this.angle += wrapAngle(theta - this.angle) * Math.min(1, dt * 5);
    this.bob = Math.sin(this.t * 1.4) * 0.8;
  }

  /** True while any part of the butterfly is inside the visible viewport. */
  visible(view: View): boolean {
    const m = this.size * 0.7;
    return this.x > -m && this.x < view.w + m && this.y > view.scrollY - m && this.y < view.scrollY + view.h + m;
  }

  private pad(): number {
    return this.size * 1.5 + 40;
  }

  private nextGoal(view: View, forceInside: boolean): void {
    this.goalAge = 0;
    this.cruise = rand(95, 175) * (44 / Math.max(26, this.size)) ** 0.35;
    const r = Math.random();
    if (!forceInside && r < 0.18) {
      this.mode = "hover";
      this.timer = rand(1.2, 3);
      return;
    }
    if (!forceInside && this.finder && r >= 0.32 && r < 0.46) {
      const perch = this.finder(this.x, this.y);
      if (perch) {
        this.perch = perch;
        this.mode = "land";
        return;
      }
    }
    if (!forceInside && r < 0.32) {
      // Slip off the side of the page it is already flying toward, linger out of sight, come back.
      this.mode = "away";
      this.timer = rand(2.5, 5);
      const right = Math.cos(this.heading) >= 0;
      const out = this.pad() + rand(80, 220);
      this.gx = right ? view.w + out : -out;
      this.gy = clamp(this.y + Math.sin(this.heading) * 200, 40, Math.max(80, view.docH - 40));
      return;
    }
    this.mode = "fly";
    // A goal a few hundred px ahead, anywhere on the page: the wide, gentle
    // arc to it is the route. Goals needing a sharp turn are passed over.
    let best: [number, number] | null = null;
    let bestTurn = Infinity;
    for (let i = 0; i < 14; i++) {
      const ahead = this.heading + rand(-1.15, 1.15);
      const reach = rand(260, Math.max(420, Math.min(900, view.docH * 0.3)));
      const x = clamp(this.x + Math.cos(ahead) * reach, view.w * 0.04, view.w * 0.96);
      const y = clamp(this.y + Math.sin(ahead) * reach, 40, Math.max(80, view.docH - 40));
      if (Math.hypot(x - this.x, y - this.y) < 200) continue;
      const turn = Math.abs(wrapAngle(Math.atan2(y - this.y, x - this.x) - this.heading));
      if (turn < bestTurn) {
        best = [x, y];
        bestTurn = turn;
      }
      if (turn < 0.9 && Math.random() < 0.5) break;
    }
    if (!best) best = [rand(view.w * 0.1, view.w * 0.9), rand(60, Math.max(120, view.docH - 60))];
    [this.gx, this.gy] = best;
  }
}
