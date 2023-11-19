import { useEffect } from 'react';
import { canvasTransform, getCanvas2DContext, requestRedraw } from '..';
export type CanvasInteractionsProps = {
  parentRef: React.RefObject<HTMLDivElement>,
  enabled: boolean
}
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
    return () => {
      if (!parent || !enabled) return;
      parent.removeEventListener('wheel', onScroll);
      parent.removeEventListener('mousedown', onMouseClick);
      parent.removeEventListener('keydown', onKeyboard)
    }
  }, [parentRef])
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
  if (ev.button === 1) {
    ev.preventDefault();
    onWheelClick();
  }
}

const onMouseUp = (ev: MouseEvent) => {
  if (ev.button === 1) {
    ev.preventDefault();
    stopMouseDrag()
  }
}

const onWheelClick = () => {
  document.body.style.cursor = 'grabbing';
  document.addEventListener('mousemove', onCanvasDrag);
  document.addEventListener('mouseup', onMouseUp)
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
  document.removeEventListener('mouseup', onMouseUp)
}

let lastTime: ReturnType<typeof Date.now>
const scrollOrPinchScale = (ev: WheelEvent) => {
  ev.preventDefault();
  if (!lastTime) {
    lastTime = Date.now()
  }

  const now = Date.now();
  if (now - lastTime < 16.67) return;
  const pinchValue = ev.deltaY >= 0 ? -0.1 : 0.1
  changeScale(pinchValue, ev.offsetX, ev.offsetY)
  lastTime = now;
}

const isPlusOrMinus = (ev: KeyboardEvent) => {
  return ev.key === '-' || ev.key === '='
}
const onKeyboard = (ev: KeyboardEvent) => {
  if ((ev.ctrlKey || ev.metaKey) && isPlusOrMinus(ev)) {
    ev.preventDefault();
    if (ev.key === '-') changeScale(-.1);
    if (ev.key === '=') changeScale(.1);
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