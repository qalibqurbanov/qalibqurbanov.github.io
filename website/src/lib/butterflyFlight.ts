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
  /** Current turn rate in rad/s; it eases toward what the goal asks for. */
  private turn = 0;
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
    this.speed = 110;
    this.turn = 0;
    this.mode = "fly";
    this.nextGoal(view, true);
  }

  /** Puts it somewhere random on the whole page, facing a random way, so
   * several butterflies never start out together or in step. */
  scatter(view: View): void {
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

  update(dt: number, view: View, slow = 1): void {
    this.t += dt;
    this.goalAge += dt;

    const dist = Math.hypot(this.gx - this.x, this.gy - this.y);

    if (this.mode === "hover") {
      this.timer -= dt;
      if (this.timer <= 0) this.nextGoal(view, false);
    } else if (this.mode === "away") {
      this.timer -= dt;
      if (this.timer <= 0) this.nextGoal(view, true);
    } else if (dist < 90 || this.goalAge > 12) {
      this.nextGoal(view, false);
    }

    // Heading: a gentle wander on top of the way to the goal, followed through
    // a turn rate that eases in and out (no instant changes of direction).
    const toGoal = Math.atan2(this.gy - this.y, this.gx - this.x);
    const wander = Math.sin(this.t * 0.7 + this.pA) * 0.3 + Math.sin(this.t * 1.7 + this.pB) * 0.12;
    const swirl = this.mode === "hover" ? Math.sin(this.t * 1.2 + this.pC) * 0.6 : 0;
    const diff = wrap(toGoal + wander + swirl - this.heading);
    const maxTurn = this.mode === "hover" ? 1.1 : 0.85;
    const wanted = clamp(diff * 1.1, -maxTurn, maxTurn);
    this.turn += (wanted - this.turn) * Math.min(1, dt * 2.2);
    this.heading += this.turn * dt;

    // Speed eases toward a target that dips in tighter turns.
    const base = this.mode === "hover" ? 26 : this.cruise * (1 + 0.18 * Math.sin(this.t * 0.6 + this.pC));
    const turnPenalty = 1 - 0.4 * Math.min(1, Math.abs(diff) / Math.PI);
    const target = base * turnPenalty * slow;
    this.speed += (target - this.speed) * Math.min(1, dt * 1.2);

    this.x += Math.cos(this.heading) * this.speed * dt;
    this.y += Math.sin(this.heading) * this.speed * dt;

    // Never wander off for good: past the limits, pick a way back (it still
    // arcs round, because the turn rate is limited).
    const pad = this.pad() * 3;
    if (this.x < -pad || this.x > view.w + pad || this.y < -pad || this.y > view.docH + pad) this.nextGoal(view, true);

    this.angle += wrap(this.heading + Math.PI / 2 - this.angle) * Math.min(1, dt * 2.5);
    this.bob = Math.sin(this.t * 6.3) * (1.5 + Math.min(3, this.speed * 0.02));
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
      const turn = Math.abs(wrap(Math.atan2(y - this.y, x - this.x) - this.heading));
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
