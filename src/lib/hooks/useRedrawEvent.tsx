import { clearCanvas } from '@practicaljs/canvas-kit';
import { useEffect, useRef } from 'react';
import { canvasTransform, getCanvas2DContext } from '..';


const clearBeforeRedraw = (cb: () => Promise<unknown> | unknown) => () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  clearCanvas(ctx, canvasTransform.scale * devicePixelRatio, canvasTransform.offset);
  cb();
}

const customEvent = new CustomEvent('request-redraw');


const registerEvent = (ev: ReturnType<typeof clearBeforeRedraw>) => {
  document.addEventListener('request-redraw', ev)
  return () => {
    document.removeEventListener('request-redraw', ev)
  }
}

export const requestRedraw = () => {
  document.dispatchEvent(customEvent);
}

export const useRedrawEvent = (cb: () => Promise<unknown> | unknown, deps: React.DependencyList) => {
  const evUnsub = useRef<() => void>();
  useEffect(() => {
    evUnsub.current = registerEvent(clearBeforeRedraw(cb));
    return () => {
      if (evUnsub.current)
        evUnsub.current();
    }
  }, deps)
}