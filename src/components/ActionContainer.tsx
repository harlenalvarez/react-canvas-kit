import { canvasTransform, getCanvas2DContext } from '@/canvas';
import { requestRedraw, useRedrawEvent } from '@/hooks';
import { getCanvasPoint } from '@practicaljs/canvas-kit';
import { useEffect } from 'react';
import { ZoomComponent } from './ZoomComponent';
import { clearPaths, drawRectangle, paths } from './drawRectangle';

const handleClick = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  const path = drawRectangle(x, y, ctx);
  canvasTransform.trackShape(path.key, path.trackingPoint.x, path.trackingPoint.y);
}

const recenter = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenter(ctx);
  requestRedraw()
}

const recenterOnShape = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const firstPath = paths[0]
  canvasTransform.recenter(ctx, firstPath.trackingPoint.x, firstPath.trackingPoint.y);
  requestRedraw();
}

const recenterOnContent = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, false);
  requestRedraw()
}

const scaleToFit = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, true)
  requestRedraw()
}

const redrawAll = () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  for (const path of paths) {
    drawRectangle(0, 0, ctx, path)
  }
}
const redraw = () => {
  requestAnimationFrame(redrawAll)
}

const checkIfInNode = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;

  const clientX = e.nativeEvent.offsetX
  const clientY = e.nativeEvent.offsetY
  const [x, y] = getCanvasPoint(clientX, clientY, ctx, true);
  let isHovering = false;
  for (const path of paths) {
    isHovering = ctx.isPointInPath(path.path, x, y);
    if (isHovering) break;
  }
  console.log('Is hovering on node ', isHovering);
}

export const ActionContainer = () => {
  useRedrawEvent(redraw, []);
  useEffect(() => {
    return () => {
      clearPaths();
    }
  })
  return (
    <div 
    style={{ width: '100%' }} 
    onClick={handleClick} 
    //onMouseMove={checkIfInNode}
    >
      <ZoomComponent />
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
      <button onClick={recenterOnContent}>Recenter around content</button>
      <button onClick={scaleToFit}>Recenter around content and scale</button>

    </div>
  )
}