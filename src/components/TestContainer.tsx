import { getCanvas2DContext } from '@/canvas';
import { useRedrawEvent } from '@/hooks';
import { getCanvasPoint } from '@practicaljs/canvas-kit';
import { drawRectangle, paths } from './drawRectangle';

const handleClick = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  drawRectangle(x, y, ctx);
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

export const TestContainer = () => {
  useRedrawEvent(redraw, []);
  return (
    <div id='test-test-test' style={{ width: '100%' }} onClick={handleClick}
    //onMouseMove={checkIfInNode}
    ></div>
  )
}


// Plan for tomorrow:
// 1. Add method to track content
// 2. Add method for recentering
// 3. Add method for recentering around content

