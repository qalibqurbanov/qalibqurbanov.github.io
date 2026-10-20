/** Flight model for the cyber butterfly. It lives in *document* coordinates:
 * it roams the whole page, so scrolling moves the page past it instead of the
 * butterfly following the screen.
 *
 * The flight is built to be smooth. There is a heading and a speed, and the
 * heading can only turn at a limited rate, so a change of goal becomes a wide,
 * rounded arc instead of a snap. A slow, wandering offset on the heading makes
 * the path meander; the speed eases up and down (slower in tight turns), and
 * now and then it hovers almost in place or slips off the side of the page and
 * comes back. Goals are mostly near whatever part of the page is on screen, so
 * it is seen often, and far goals are picked ahead of it where possible. */

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export interface View {
  /** Page width and the visible height. */
  w: number;
  h: number;
  scrollY: number;
  /** Full height of the document. */
  docH: number;
}

type Mode = "fly" | "hover" | "away";

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

  private readonly size: number;
  private mode: Mode = "fly";
  private gx = 0;
  private gy = 0;
  private goalAge = 0;
  private timer = 0;
  private cruise = 120;
  private t = rand(0, 100);
  private readonly pA = rand(0, 6.28);
  private readonly pB = rand(0, 6.28);
  private readonly pC = rand(0, 6.28);

  constructor(size: number, view: View) {
    this.size = size;
    this.respawn(view);
  }

  /** Puts it just beyond a side of the page, level with the visible part, and sends it in. */
  respawn(view: View): void {
    const fromLeft = Math.random() < 0.5;
    const pad = this.pad();
    this.x = fromLeft ? -pad : view.w + pad;
    this.y = view.scrollY + rand(view.h * 0.15, view.h * 0.85);
    this.heading = fromLeft ? rand(-0.5, 0.5) : Math.PI + rand(-0.5, 0.5);
    this.angle = this.heading + Math.PI / 2;
    this.speed = 90;
    this.mode = "fly";
    this.cruise = rand(90, 150);
    this.nextGoal(view, true);
  }

  update(dt: number, view: View, slow = 1): void {
    this.t += dt;
    this.goalAge += dt;

    const midView = view.scrollY + view.h / 2;
    const farFromView = Math.abs(this.y - midView) > view.h * 1.25;
    const dist = Math.hypot(this.gx - this.x, this.gy - this.y);

    if (this.mode === "hover") {
      this.timer -= dt;
      if (this.timer <= 0) this.nextGoal(view, false);
    } else if (this.mode === "away") {
      this.timer -= dt;
      if (this.timer <= 0) this.nextGoal(view, true);
    } else if (dist < 80 || this.goalAge > 9 || (farFromView && this.goalAge > 2.5)) {
      this.nextGoal(view, false);
    }

    // Heading: turn toward the goal at a limited rate, plus a slow meander.
    const toGoal = Math.atan2(this.gy - this.y, this.gx - this.x);
    const meander = Math.sin(this.t * 0.9 + this.pA) * 0.42 + Math.sin(this.t * 2.3 + this.pB) * 0.2;
    const hoverSwirl = this.mode === "hover" ? Math.sin(this.t * 1.6 + this.pC) * 1.4 : 0;
    const diff = wrap(toGoal + meander + hoverSwirl - this.heading);
    const maxTurn = this.mode === "hover" ? 1.6 : 1.15;
    this.heading += clamp(diff * 1.8, -maxTurn, maxTurn) * dt;

    // Speed eases toward a target that dips in tight turns and rises when it
    // has to catch up with the visible part of the page.
    const base = this.mode === "hover" ? 14 : this.cruise * (1 + 0.22 * Math.sin(this.t * 0.7 + this.pC));
    const turnPenalty = 1 - 0.5 * Math.min(1, Math.abs(diff) / Math.PI);
    const catchUp = farFromView ? 1.9 : 1;
    const target = base * turnPenalty * catchUp * slow;
    this.speed += (target - this.speed) * Math.min(1, dt * 1.4);

    this.x += Math.cos(this.heading) * this.speed * dt;
    this.y += Math.sin(this.heading) * this.speed * dt;

    // Never wander off for good: past the limits, head straight back.
    const pad = this.pad() * 3;
    if (this.x < -pad || this.x > view.w + pad || this.y < -pad || this.y > view.docH + pad) this.nextGoal(view, false);

    this.angle += wrap(this.heading + Math.PI / 2 - this.angle) * Math.min(1, dt * 3);
    this.bob = Math.sin(this.t * 6.3) * (2 + Math.min(4, this.speed * 0.025));
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
    this.cruise = rand(80, 165);
    const r = Math.random();
    if (!forceInside && r < 0.2) {
      this.mode = "hover";
      this.timer = rand(0.8, 2.2);
      return;
    }
    if (!forceInside && r < 0.38) {
      // Slip off the side of the page, linger out of sight, come back.
      this.mode = "away";
      this.timer = rand(1.6, 3.8);
      const side = this.x < view.w / 2 ? -1 : 1;
      const out = this.pad() + rand(40, 160);
      this.gx = side < 0 ? -out : view.w + out;
      this.gy = clamp(this.y + rand(-160, 160), view.scrollY + 40, view.scrollY + view.h - 40);
      return;
    }
    this.mode = "fly";
    // Prefer a goal ahead of where it is heading, so there is room to curve.
    let best: [number, number] | null = null;
    for (let i = 0; i < 8; i++) {
      const x = rand(view.w * 0.06, view.w * 0.94);
      const near = Math.random() < 0.78;
      const y = near
        ? view.scrollY + rand(view.h * 0.08, view.h * 0.92)
        : clamp(view.scrollY + rand(-view.h * 0.9, view.h * 1.9), 40, Math.max(80, view.docH - 40));
      const d = Math.hypot(x - this.x, y - this.y);
      if (d < Math.min(view.w, view.h) * 0.25) continue;
      const turn = Math.abs(wrap(Math.atan2(y - this.y, x - this.x) - this.heading));
      best = [x, y];
      if (turn < 1.6) break;
    }
    if (!best) best = [rand(view.w * 0.1, view.w * 0.9), view.scrollY + rand(view.h * 0.1, view.h * 0.9)];
    [this.gx, this.gy] = best;
  }
}
