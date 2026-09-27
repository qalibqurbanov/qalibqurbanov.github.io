import { useCallback, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { publishDisturbance } from "@/lib/dragDisturbance";

const INTERACTIVE_SELECTOR = "button, a, input, [role='tab']";

interface DragStart {
  pointerX: number;
  pointerY: number;
  offsetX: number;
  offsetY: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  baseLeft: number;
  baseTop: number;
  width: number;
  height: number;
}

/** Makes an element draggable, by a separate title-bar handle, within the
 * nearest ancestor matching `boundsSelector`. It snaps straight back to its
 * default position the moment the pointer is released. While dragging, it
 * also broadcasts its live position (see `dragDisturbance`) so other
 * elements on the page — e.g. header items — can react to it passing over
 * them. Clicks on buttons/tabs/links inside the handle are left alone so
 * tab-switching etc. keep working. */
export function useDraggableWindow<T extends HTMLElement>(boundsSelector: string) {
  const windowRef = useRef<T>(null);
  const dragStart = useRef<DragStart | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    setOffset({ x: 0, y: 0 });
    publishDisturbance(null);
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.target instanceof HTMLElement && event.target.closest(INTERACTIVE_SELECTOR)) return;

    const el = windowRef.current;
    const bounds = el?.closest<HTMLElement>(boundsSelector);
    if (!el || !bounds) return;

    const elRect = el.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    const baseLeft = elRect.left - offset.x;
    const baseTop = elRect.top - offset.y;

    dragStart.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
      minX: boundsRect.left - baseLeft,
      maxX: boundsRect.right - elRect.width - baseLeft,
      minY: boundsRect.top - baseTop,
      maxY: boundsRect.bottom - elRect.height - baseTop,
      baseLeft,
      baseTop,
      width: elRect.width,
      height: elRect.height,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const start = dragStart.current;
    if (!start) return;

    const rawX = start.offsetX + (event.clientX - start.pointerX);
    const rawY = start.offsetY + (event.clientY - start.pointerY);
    const x = Math.min(Math.max(rawX, start.minX), start.maxX);
    const y = Math.min(Math.max(rawY, start.minY), start.maxY);

    setOffset({ x, y });

    const left = start.baseLeft + x;
    const top = start.baseTop + y;
    publishDisturbance({
      left,
      top,
      right: left + start.width,
      bottom: top + start.height,
    });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    if (!dragStart.current) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStart.current = null;
    setDragging(false);
    reset();
  }

  return {
    windowRef,
    dragging,
    windowStyle: {
      transform: `translate(${offset.x}px, ${offset.y}px)`,
      transition: dragging ? "none" : "transform 0.4s ease-out",
    },
    dragHandleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
    },
  };
}
