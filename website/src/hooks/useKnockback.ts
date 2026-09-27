import { useEffect, useRef, useState } from "react";

import { getDisturbanceRect, subscribeDisturbance, type DisturbanceRect } from "@/lib/dragDisturbance";

const BASE_DISTANCE = 55;
const DISTANCE_JITTER = 55;
const ANGLE_SPREAD = Math.PI / 2; // +/- 90deg off the straight "away" direction
const ROTATE_JITTER = 35;
const RETURN_DELAY_MS = 900;

function intersects(a: DOMRect, b: DisturbanceRect) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/** Knocks an element to a random nearby spot when the dragged terminal
 * window passes over it, then eases it back to rest a moment after it's no
 * longer touched. Each fresh touch rolls a new random direction/distance/
 * rotation so repeated hits scatter rather than repeat the same nudge;
 * `seed` just biases which side of the "away from the terminal" direction
 * each element tends to favor, so a whole row doesn't fly the same way. */
export function useKnockback<T extends HTMLElement>(seed = 0) {
  const ref = useRef<T>(null);
  const returnTimer = useRef<number | undefined>(undefined);
  const hit = useRef(false);
  const [offset, setOffset] = useState({ x: 0, y: 0, rotate: 0 });

  useEffect(() => {
    const sideBias = seed % 2 === 0 ? 1 : -1;

    function scheduleReturn() {
      if (returnTimer.current !== undefined) return;
      returnTimer.current = window.setTimeout(() => {
        returnTimer.current = undefined;
        setOffset({ x: 0, y: 0, rotate: 0 });
      }, RETURN_DELAY_MS);
    }

    function evaluate() {
      const el = ref.current;
      const disturbance = getDisturbanceRect();

      if (el && disturbance) {
        const rect = el.getBoundingClientRect();
        if (intersects(rect, disturbance)) {
          window.clearTimeout(returnTimer.current);
          returnTimer.current = undefined;

          if (!hit.current) {
            hit.current = true;

            const elCenterX = rect.left + rect.width / 2;
            const elCenterY = rect.top + rect.height / 2;
            const dCenterX = (disturbance.left + disturbance.right) / 2;
            const dCenterY = (disturbance.top + disturbance.bottom) / 2;

            const awayAngle = Math.atan2(elCenterY - dCenterY, elCenterX - dCenterX);
            const angle = awayAngle + sideBias * Math.random() * ANGLE_SPREAD;
            const distance = BASE_DISTANCE + Math.random() * DISTANCE_JITTER;
            const rotate = (Math.random() - 0.5) * 2 * ROTATE_JITTER;

            setOffset({
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              rotate,
            });
          }
          return;
        }
      }

      hit.current = false;
      scheduleReturn();
    }

    const unsubscribe = subscribeDisturbance(evaluate);
    return () => {
      unsubscribe();
      window.clearTimeout(returnTimer.current);
    };
  }, [seed]);

  const atRest = offset.x === 0 && offset.y === 0 && offset.rotate === 0;

  return {
    ref,
    style: {
      transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.rotate}deg)`,
      transition: atRest
        ? "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
        : "transform 0.15s ease-out",
    },
  };
}
