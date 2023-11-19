import { canvasTransform, getCanvas2DContext } from '@/canvas';
import { requestRedraw, useRedrawEvent } from '@/hooks';
import { getCanvasPoint } from '@practicaljs/canvas-kit';
import { drawRectangle, paths } from './drawRectangle';

const handleClick = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  console.log(x, y)
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

const recenterOnContentAndScale = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, true)
  requestRedraw()
}

const redraw = () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  for (let path of paths) {
    window.requestAnimationFrame(() => drawRectangle(0, 0, ctx, path))
  }
}

const checkIfInNode = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;

  const clientX = e.nativeEvent.offsetX
  const clientY = e.nativeEvent.offsetY
  const [x, y] = getCanvasPoint(clientX, clientY, ctx, true);
  let isHovering = false;
  for (let path of paths) {
    isHovering = ctx.isPointInPath(path, x, y);
    if (isHovering) break;
  }
  console.log('Is hovering on node ', isHovering);
}

export const ActionContainer = () => {
  useRedrawEvent(redraw, []);
  return (
    <div id='test-test-test' style={{ width: '100%' }} onClick={handleClick}
    //onMouseMove={checkIfInNode}
    >
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
      <button onClick={recenterOnContent}>Recenter around content</button>
      <button onClick={recenterOnContentAndScale}>Recenter around content and scale</button>
    </div>
  )
}


// Plan for tomorrow:
// 1. Add method to track content
// 2. Add method for recentering
// 3. Add method for recentering around content
