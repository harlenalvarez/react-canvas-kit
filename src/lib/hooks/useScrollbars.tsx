import { clamp, fromAlphaToHex, getCanvasCenter, getMidPoint } from '@practicaljs/canvas-kit'
import { useEffect, useSyncExternalStore } from 'react'
import { canvasTransform, getCanvas2DContext, useRedrawEvent } from '..'

export type ScrollbarsProps = {
  enabled: boolean
}

class ScrollBarProxy  {
  horizontal: Path2D | null = null;
  vertical: Path2D | null = null;
}

export const scrollbarsProxy = new ScrollBarProxy();

const getViewPort = (ctx: CanvasRenderingContext2D) => {
  const { height, width, top } = ctx.canvas.getBoundingClientRect();
  const scale = canvasTransform.scale;
  const [cX, cY] = getCanvasCenter(ctx);
  const topX = (cX - (width / scale) / 2)
  const topY = (cY - (height / scale) / 2)
  return { x: topX, y: topY, width: width / scale, height: (height - top) / scale, centerX: cX, centerY: cY };
}


const alpha = fromAlphaToHex(.5);

const drawScrollBars = () => {
  if (!canvasTransform.trackingEnabled) return;
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const { x1, x2, y1, y2 } = canvasTransform.getTrackingSnapshot();
  const { x, y, width, height, centerX } = getViewPort(ctx);
  
  const mostLeft = Math.min(x1, x);
  const mostRight = Math.max(x2, x + width);
  const mostTop = Math.min(y1, y);
  const mostBottom = Math.max(y2, y + height);
  const {x: mX, y: mY} = getMidPoint({x: mostLeft, y: mostTop}, {x: mostRight, y: mostBottom});

  const trackingWidth = mostRight - mostLeft;
  const trackingHeight = mostBottom - mostTop;
  const needsScrollBarHorizontal = x1 < x || x2 > x + width;
  const needsScrollBarVertical = y1 < y || y2 > y + height;

  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.strokeStyle = 'red'
  ctx.lineWidth = 5;
  ctx.stroke();

  const scrollThickness = 7 / canvasTransform.scale
  const scrollMargin = 10 / canvasTransform.scale
  const marginLeft = 5 / canvasTransform.scale
  const marginRight = 10 / canvasTransform.scale
  const minScrollBarLength = 30 / canvasTransform.scale;

  if (needsScrollBarHorizontal) {

    const contentRatio = width / trackingWidth;
  
    let totalWidth = width * contentRatio;
    totalWidth = Math.max(totalWidth, minScrollBarLength);
    
     // Calculate the offset of the content from the viewport's left edge
    const contentOffset = mostLeft - x;

     // Calculate the difference between centers
    const centerDifference = centerX - mX
    
    // Normalize the difference and adjust to a 0-1 range
    const normalizedDifference = (centerDifference / trackingWidth) + 0.5;
    const proportionalCenter = Math.max(0, Math.min(normalizedDifference, 1));


    let staringPointX = proportionalCenter - totalWidth / 2
    staringPointX = clamp(staringPointX, x + marginLeft, x + width - totalWidth - marginRight)

    console.log(`View port center: ${centerX}, content center: ${mX}, proportional center: ${proportionalCenter}`)
    console.log(`Content Offset: ${contentOffset}, Visible Content Width: ${width}`);
    console.log(`Content Ratio: ${contentRatio}, Total Width: ${totalWidth}, Starting Point X: ${staringPointX}`);
    

   // totalWidth = Math.max(totalWidth + offset, minScrollBarLength);
    scrollbarsProxy.horizontal = new Path2D();
    scrollbarsProxy.horizontal.roundRect(staringPointX, y + height - scrollMargin, totalWidth, scrollThickness, 30);
    ctx.beginPath();
    ctx.fillStyle = `#777778${alpha}`;
    ctx.fill(scrollbarsProxy.horizontal);
  }
  else {
    scrollbarsProxy.horizontal = null;
  }

  if (needsScrollBarVertical) {
    let staringPointY = y + marginLeft;
    let totalHeight = height - marginRight;
    let offset = 0
    if(y2 > y + height) {
      offset = y + height - y2;
    }
    else {
      offset = y1 - y;
      staringPointY = Math.min(staringPointY - offset, y + height - minScrollBarLength - marginLeft)
    }
    totalHeight = Math.max(totalHeight + offset, minScrollBarLength);
    scrollbarsProxy.vertical = new Path2D()
    scrollbarsProxy.vertical.roundRect(x + width - scrollMargin, staringPointY, scrollThickness, totalHeight, 30);
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