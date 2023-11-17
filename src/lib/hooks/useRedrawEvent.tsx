import { drawSubscribers } from '@/internal';
import { clearCanvas } from '@practicaljs/canvas-kit';
import { useEffect, useRef } from 'react';
import { canvasTransform, getCanvas2DContext } from '..';


const clearBeforeRedraw = (cb: () => Promise<any> | any) => () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  clearCanvas(ctx, canvasTransform.scale * devicePixelRatio, canvasTransform.offset);
  cb();
}


const registerEvent = (ev: ReturnType<typeof clearBeforeRedraw>) => {
  drawSubscribers.add(ev);
  return () => {
    drawSubscribers.delete(ev);
  }
}

export const requestRedraw = () => {
  for (const sub of drawSubscribers) sub();
}

export const useRedrawEvent = (cb: () => Promise<any> | any, deps: React.DependencyList) => {
  let evUnsub = useRef<() => void>();
  useEffect(() => {
    evUnsub.current = registerEvent(clearBeforeRedraw(cb));
    return () => {
      if (evUnsub.current)
        evUnsub.current();
    }
  }, deps)
}