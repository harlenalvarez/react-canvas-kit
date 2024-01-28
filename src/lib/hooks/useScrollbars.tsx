import { fromAlphaToHex, getViewPort } from '@practicaljs/canvas-kit';
import { canvasTransform, getCanvas2DContext, useRedrawEvent } from '..';

export type ScrollbarsProps = {
  enabled: boolean
}

class ScrollBarProxy {
  horizontal: Path2D | null = null;
  vertical: Path2D | null = null;
}

export const scrollbarsProxy = new ScrollBarProxy();

const alpha = fromAlphaToHex(.5);

// formula for getting offset that I'm using is
// (viewX - contetX) * (width / totalWidth) and for vertical is the same with Y
const scrollOffset = (viewAxis: number, contentAxis: number, changeDiff: number) => {
  return (viewAxis - contentAxis) * changeDiff;
}

const drawScrollBars = () => {
  if (!canvasTransform.trackingEnabled) return;
  const ctx = getCanvas2DContext('internal');
  if (!ctx) return;
  const { x1, x2, y1, y2 } = canvasTransform.getTrackingSnapshot();
  const { x, y, width, height } = getViewPort(ctx, canvasTransform.scale);
  const viewX2 = x + width;
  const viewY2 = y + height;
  const mostLeft = Math.min(x1, x);
  const mostRight = Math.max(x2, viewX2);
  const mostTop = Math.min(y1, y);
  const mostBottom = Math.max(y2, viewY2);

  const trackingWidth = mostRight - mostLeft;
  const wt = width / trackingWidth;
  //const trackingHeight = mostBottom - mostTop;
  const needsScrollBarHorizontal = x1 < x || x2 > x + width;
  const needsScrollBarVertical = y1 < y || y2 > y + height;

  const scrollThickness = 7 / canvasTransform.scale
  const scrollMargin = 10 / canvasTransform.scale
  const margin = 10 / canvasTransform.scale;

  if (needsScrollBarHorizontal) {
    const scrollX1 = Math.max(x + scrollOffset(x, mostLeft, wt), x + margin);
    const scrollX2 = Math.min(viewX2 + scrollOffset(viewX2, mostRight, wt), viewX2 - margin);
    const scrollWidth = scrollX2 - scrollX1;

    scrollbarsProxy.horizontal = new Path2D();
    scrollbarsProxy.horizontal.roundRect(scrollX1, y + height - scrollMargin, scrollWidth, scrollThickness, 30);
    ctx.beginPath();
    ctx.fillStyle = `#777778${alpha}`;
    ctx.fill(scrollbarsProxy.horizontal);
  }
  else {
    scrollbarsProxy.horizontal = null;
  }

  if (needsScrollBarVertical) {
    const scrollY1 = Math.max(y + scrollOffset(y, mostTop, wt), y + margin);
    const scrollY2 = Math.min(viewY2 + scrollOffset(viewY2, mostBottom, wt), viewY2 - margin);
    const scrollHeight = scrollY2 - scrollY1;
    scrollbarsProxy.vertical = new Path2D()
    scrollbarsProxy.vertical.roundRect(x + width - scrollMargin, scrollY1, scrollThickness, scrollHeight, 30);
    ctx.beginPath();
    ctx.fillStyle = `#777778${alpha}`;
    ctx.fill(scrollbarsProxy.vertical);
  }
  else {
    scrollbarsProxy.vertical = null;
  }

  ctx.restore();
}

export const useScrollbars = () => {
  useRedrawEvent(drawScrollBars, [])
}