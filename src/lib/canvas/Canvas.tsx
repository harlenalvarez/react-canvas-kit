import { CanvasContainerProps } from '@/container';
import { requestRedraw } from '@/hooks';
import { useEffect, useLayoutEffect } from 'react';
import { canvasTransform } from './CanvasTransform';

type CanvasProps = object & Omit<CanvasContainerProps, 'children'>

const canvasId = 'pj-react-canvas-kit-canvas-element';
const getCanvasElement = () => document.getElementById(canvasId) as HTMLCanvasElement | null

const resizeObserver = new ResizeObserver((entries) => {
  const body = entries[0];
  initCanvas(body.contentRect.width, body.contentRect.height);
});

const handleResize = () => {
  initCanvas(window.innerWidth, window.innerHeight)
}

export const getCanvas2DContext = (inCanvas?: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
  const canvas = inCanvas ?? getCanvasElement();
  if (!canvas) return null;
  return canvas.getContext('2d');
}

const updateBackgroundTransform = (scale: number, matrix: DOMMatrix) => {
  const canvasBackgroundDiv = document.getElementById('canvas-kit-canvas-section');
  if (!canvasBackgroundDiv) return;

  // Extract the effective offsetX and offsetY from the matrix
  const adjustedTranslateX = matrix.e / window.devicePixelRatio;
  const adjustedTranslateY = matrix.f / window.devicePixelRatio;

  canvasBackgroundDiv.style.backgroundPosition = `${adjustedTranslateX}px ${adjustedTranslateY}px`;
  canvasBackgroundDiv.style.backgroundSize = `${scale * 20}px ${scale * 20}px`
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

  updateBackgroundTransform(canvasTransform.scale, ctx.getTransform());
}

const initCanvas = (width: number, height: number) => {
  const canvasElement = getCanvasElement();
  if (!canvasElement) return;
  const ctx = getCanvas2DContext(canvasElement);
  if (!ctx) return;
  canvasElement.width = width * window.devicePixelRatio;
  canvasElement.style.width = `${width}px`;
  canvasElement.height = height * window.devicePixelRatio;
  canvasElement.style.height = `${height}px`;
  setCanvasTransform(ctx)
  requestRedraw();
}

const onFullScreenCanvasLoad = (offset: number) => {
  const height = window.innerHeight - offset;
  initCanvas(window.innerWidth, height)
}

const setTransformOnChange = () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  setCanvasTransform(ctx);
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
      <canvas id={canvasId}>HTML Canvas is not supported in this browser, to view this content refer to the list of supported browsers <a href='https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API#browser_compatibility'>Browser Compatinility</a></canvas>
    </>
  );
};
