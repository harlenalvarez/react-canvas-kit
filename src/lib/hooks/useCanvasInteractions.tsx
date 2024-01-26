import { clamp } from '@practicaljs/canvas-kit';
import { useEffect } from 'react';
import { canvasTransform, getCanvas2DContext, keyboardEventContext, requestRedraw } from '..';
export type CanvasInteractionsProps = {
  parentRef: React.RefObject<HTMLDivElement>,
  enabled: boolean
}

class InteractionsState {
  panning = false;
  preventOnClick = false;

  reset = () => {
    this.panning = false;
    this.preventOnClick = false;
  }
}

const interactionsState = new InteractionsState();

/**
 * Method to control pan, zoom and scroll
 */
export const useCanvasInteractions = ({ parentRef, enabled }: CanvasInteractionsProps, _: React.DependencyList) => {
  useEffect(() => {
    const parent = parentRef?.current
    if (!parent || !enabled) return;
    parent.addEventListener('wheel', onScroll, { passive: false });
    parent.addEventListener('mousedown', onMouseClick);
    parent.addEventListener('keydown', onKeyboard);
    parent.addEventListener('keyup', onKeyboardUp);
    parent.addEventListener('click', preventOnPanning)
    return () => {
      if (!parent || !enabled) return;
      parent.removeEventListener('wheel', onScroll);
      parent.removeEventListener('mousedown', onMouseClick);
      parent.removeEventListener('keydown', onKeyboard);
      parent.removeEventListener('keyup', onKeyboardUp);
      parent.removeEventListener('click', preventOnPanning);
      keyboardEventContext.keys = 0;
      interactionsState.reset();
    }
  }, [parentRef, enabled])
}


const onScroll = (ev: WheelEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  ev.stopPropagation();
  ev.preventDefault();

  if (ev.ctrlKey || ev.metaKey) {
    scrollOrPinchScale(ev)
  }
  else {
    canvasTransform.changeOffset(ev.deltaX, ev.deltaY);
    requestRedraw();
  }
}

const onMouseClick = (ev: MouseEvent) => {
  if (ev.button === 1 || (ev.button === 0 && keyboardEventContext.Space)) {
    ev.preventDefault();
    onWheelClick();
  }
}

const onMouseUp = (ev: MouseEvent) => {
  if (ev.button === 1 || (ev.button === 0 && keyboardEventContext.Space)) {
    ev.preventDefault();
    ev.stopPropagation();
    stopMouseDrag()
  }
}

const onWheelClick = () => {
  document.body.style.cursor = 'grabbing';
  document.addEventListener('mousemove', onCanvasDrag);
  document.addEventListener('mouseup', onMouseUp);
  interactionsState.panning = true;
}

const onCanvasDrag = (ev: MouseEvent) => {
  ev.stopPropagation();
  const deltaX = ev.movementX * devicePixelRatio;
  const deltaY = ev.movementY * devicePixelRatio;
  canvasTransform.changeOffset(-deltaX, -deltaY);
  requestRedraw();
}

const stopMouseDrag = () => {
  document.body.style.cursor = 'default';
  document.removeEventListener('mousemove', onCanvasDrag);
  document.removeEventListener('mouseup', onMouseUp);
  interactionsState.panning = false;
  interactionsState.preventOnClick = true;
}

const scrollOrPinchScale = (ev: WheelEvent) => {
  ev.preventDefault();
  const mx = clamp(ev.deltaY, -10, 10)
  const pinchValue = Math.round(mx + Number.EPSILON) / 100
  changeScale(-pinchValue, ev.offsetX, ev.offsetY)
}

const isPlusOrMinus = (ev: KeyboardEvent) => {
  return ev.key === '-' || ev.key === '='
}

const onKeyboard = (ev: KeyboardEvent) => {
  keyboardEventContext.addKey(ev);
  if ((ev.ctrlKey || ev.metaKey) && isPlusOrMinus(ev)) {
    ev.preventDefault();
    if (ev.key === '-') changeScale(-.1);
    if (ev.key === '=') changeScale(.1);
  }
}

const onKeyboardUp = (ev: KeyboardEvent) => {
  if (keyboardEventContext.Space && interactionsState.panning) {
    stopMouseDrag();
  }
  keyboardEventContext.removeKey(ev);
}

const preventOnPanning = (ev: MouseEvent) => {
  if (interactionsState.preventOnClick) {
    ev.preventDefault();
    ev.stopPropagation();
    interactionsState.preventOnClick = false;
  }
}

/**
 * Changes 
 * @param value 
 */
export const changeScale = (value: number, x?: number, y?: number) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.changeScale(value, ctx, x, y);
  requestRedraw();
}