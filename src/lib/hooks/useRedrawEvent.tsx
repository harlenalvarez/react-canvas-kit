import { canvasLayer } from '@/internal';
import { clearCanvas } from '@practicaljs/canvas-kit';
import { useEffect, useRef } from 'react';
import { canvasTransform, getCanvas2DContext } from '..';


const clearBeforeRedraw = (cb: () => Promise<unknown> | unknown, layer: keyof typeof canvasLayer) => () => {
  const ctx = getCanvas2DContext(layer);
  if (!ctx) return;
  clearCanvas(ctx, canvasTransform.scale * devicePixelRatio, canvasTransform.offset);
  if (layer === 'main') {
    const internalCtx = getCanvas2DContext('internal');
    if (internalCtx) {
      clearCanvas(internalCtx, canvasTransform.scale * devicePixelRatio, canvasTransform.offset);
    }
  }
  cb();
}

// this event is also used for internal layer since they're tighly coupled
const customEventMain = new CustomEvent('request-redraw-main');
const customEventTop = new CustomEvent('request-redraw-top');


const registerEvent = (ev: ReturnType<typeof clearBeforeRedraw>, layer?: keyof typeof canvasLayer) => {
  const layerName = layer === 'top' ? 'top' : 'main';
  document.addEventListener(`request-redraw-${layerName}`, ev)
  return () => {
    document.removeEventListener(`request-redraw-${layerName}`, ev)
  }
}

/**
 * Redraws that canvas layer
 * @param layer - Canvas layer to redraw on, defaults to main
 * Note: If you're directly manipulating the canvasTransform, call the requestRedrawAllLayers
 */
export const requestRedraw = (layer?: keyof typeof canvasLayer) => {
  const redrawEvent = layer === 'top' ? customEventTop : customEventMain;
  document.dispatchEvent(redrawEvent);
}

/**
 * If you'r
 */
export const requestRedrawAllLayers = () => {
  requestRedraw('top');
  requestRedraw('main');
}

export const useRedrawEvent = (cb: () => Promise<unknown> | unknown, deps: React.DependencyList) => {
  const evUnsub = useRef<() => void>();
  useEffect(() => {
    evUnsub.current = registerEvent(clearBeforeRedraw(cb, 'main'), 'main');
    return () => {
      if (evUnsub.current)
        evUnsub.current();
    }
  }, deps)
}

export const useTopRedrawEvent = (cb: () => Promise<unknown> | unknown, deps: React.DependencyList) => {
  const evUnsub = useRef<() => void>();
  useEffect(() => {
    evUnsub.current = registerEvent(clearBeforeRedraw(cb, 'top'), 'top');
    return () => {
      if (evUnsub.current)
        evUnsub.current();
    }
  }, deps)
}