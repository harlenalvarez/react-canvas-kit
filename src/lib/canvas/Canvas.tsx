import { CanvasContainerProps } from '@/container';
import { requestRedrawAllLayers } from '@/hooks';
import { canvasLayer, getCanvasElement } from '@/internal';
import { getCanvas2DContext } from '@/utils';
import { useEffect, useLayoutEffect } from 'react';
import styles from './Canvas.module.css';
import { canvasTransform } from './CanvasTransform';

type CanvasProps = object & Omit<CanvasContainerProps, 'children'>


const resizeObserver = new ResizeObserver((entries) => {
  const body = entries[0];
  initCanvas(body.contentRect.width, body.contentRect.height);
});

const handleResize = () => {
  initCanvas(window.innerWidth, window.innerHeight)
}

const updateBackgroundTransform = (scale: number, matrix: DOMMatrix) => {
  const canvasBackgroundDiv = document.getElementById('canvas-kit-canvas-section');
  if (!canvasBackgroundDiv) return;

  // Extract the effective offsetX and offsetY from the matrix
  const adjustedTranslateX = matrix.e / window.devicePixelRatio;
  const adjustedTranslateY = matrix.f / window.devicePixelRatio;

  canvasBackgroundDiv.style.backgroundPosition = `${adjustedTranslateX}px ${adjustedTranslateY}px`;
  const bgSize = 30
  canvasBackgroundDiv.style.backgroundSize = `${scale * bgSize}px ${scale * bgSize}px`
}


const setCanvasTransform = (ctx: CanvasRenderingContext2D) => {
  ctx.setTransform(
    canvasTransform.scale * window.devicePixelRatio,
    0,
    0,
    canvasTransform.scale * window.devicePixelRatio,
    canvasTransform.offset.x,
    canvasTransform.offset.y
  )
}

const initCanvas = (width: number, height: number) => {
  let ctx: CanvasRenderingContext2D | null = null;
  for (const layerId of Object.values(canvasLayer)) {
    const canvasElement = getCanvasElement(layerId);
    if (!canvasElement) continue;
    ctx = getCanvas2DContext(undefined, canvasElement);
    if (!ctx) continue;
    canvasElement.width = width * window.devicePixelRatio;
    canvasElement.style.width = `${width}px`;
    canvasElement.height = height * window.devicePixelRatio;
    canvasElement.style.height = `${height}px`;
    setCanvasTransform(ctx);
  }
  if (ctx) {
    updateBackgroundTransform(canvasTransform.scale, ctx.getTransform());
  }
  requestRedrawAllLayers();
}

const onFullScreenCanvasLoad = (offset: number) => {
  const height = window.innerHeight - offset;
  initCanvas(window.innerWidth, height);
}

const setTransformOnChange = () => {
  const internalCtx = getCanvas2DContext('internal');
  if (internalCtx) {
    setCanvasTransform(internalCtx);
  }
  const topCtx = getCanvas2DContext('top');
  if (topCtx) {
    setCanvasTransform(topCtx);
  }
  const ctx = getCanvas2DContext();
  if (ctx) {
    setCanvasTransform(ctx);
    updateBackgroundTransform(canvasTransform.scale, ctx.getTransform());
  }
}

const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let unsub: ReturnType<typeof canvasTransform.subscribe>;
export const Canvas = ({ fullScreen, offsetTop }: CanvasProps) => {
  if (fullScreen) {
    onFullScreenCanvasLoad(offsetTop ?? 0);
  }

  useEffect(() => {
    unsub = canvasTransform.syncSubscribe(setTransformOnChange);
    return () => {
      if (unsub) unsub();
    }
  }, [])

  // TODO: Add else for non fullscreen mode
  useLayoutEffect(() => {
    if (fullScreen) {
      // Special fix for a special browser (IE would be proud)
      if (isSafari()) {
        handleResize()
        window.addEventListener('resize', handleResize)
      }
      else {
        resizeObserver.observe(document.body, { box: 'device-pixel-content-box' });
      }
    }
    return () => {
      if (fullScreen) {
        if (isSafari()) {
          window.removeEventListener('resize', handleResize)
        }
        else {
          resizeObserver.unobserve(document.body)
        }
      }
    }
  }, [fullScreen])

  return (
    <>
      <canvas id={canvasLayer.main} className={styles.canvasChild}>HTML Canvas is not supported in this browser, to view this content refer to the list of supported browsers <a href='https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API#browser_compatibility'>Browser Compatinility</a></canvas>
      <canvas id={canvasLayer.top} className={styles.canvasChild}>HTML Canvas is not supported in this browser, to view this content refer to the list of supported browsers <a href='https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API#browser_compatibility'>Browser Compatinility</a></canvas>
      <canvas id={canvasLayer.internal} className={styles.canvasChild}>HTML Canvas is not supported in this browser, to view this content refer to the list of supported browsers <a href='https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API#browser_compatibility'>Browser Compatinility</a></canvas>
    </>
  );
};
