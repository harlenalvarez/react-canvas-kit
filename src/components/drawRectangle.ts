import { CanvasPath2D } from '@/index';

export const paths: CanvasPath2D[] = []
export const drawRectangle = (x: number, y: number, ctx: CanvasRenderingContext2D, path?: CanvasPath2D) => {
  if (!path) {
    const key = crypto.randomUUID()
    path = new CanvasPath2D({
      key,
      trackingPoint: { x: x + 50, y: y + 50 }
    });
    path.roundRect(x, y, 100, 100, 4);
    paths.push(path);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = '#646cff';
  ctx.lineWidth = 4;
  ctx.stroke(path);
}

