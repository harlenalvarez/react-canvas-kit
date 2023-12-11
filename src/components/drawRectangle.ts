import { CanvasPath2D } from '@/index';
import { Point, parseFont } from '@practicaljs/canvas-kit';

export let paths: Rect2D[] = []
export const clearPaths = () => {
  paths = [];
}

type React2dProps = {
  key: string
  point: Point,
  height: number,
  width: number
}
class Rect2D extends CanvasPath2D {
  icon: Path2D
  path: Path2D
  point: Point
  font: string
  constructor({ key, point, height, width }: React2dProps) {
    super({
      key,
      trackingPoint: { x: point.x + width / 2, y: point.y + height / 2 }
    })
    this.point = point;
    this.path = new Path2D();
    this.path.roundRect(point.x, point.y, width, height, 4);
    this.font = parseFont({ fontSize: 14, fontFamily: 'Roboto', fontWeight: 400 })
    const svg = new Path2D('M21 15.5018C18.651 14.5223 17 12.2039 17 9.5C17 6.79774 18.6534 4.48062 21 3.5C20.2304 3.17906 19.3859 3 18.5 3C15.7977 3 13.4806 4.64899 12.5 6.9956M6.9 21C4.74609 21 3 19.2889 3 17.1781C3 15.4286 4.3 13.8125 6.25 13.5C6.86168 12.0617 8.30934 11 9.9978 11C12.1607 11 13.9285 12.6589 14.05 14.75C15.1978 15.2463 16 16.4645 16 17.7835C16 19.5599 14.5449 21 12.75 21L6.9 21Z');
    const matrix = new DOMMatrix()
    matrix.translateSelf(this.trackingPoint.x, this.trackingPoint.y)
    this.icon = new Path2D()
    this.icon.addPath(svg, matrix)
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.moveTo(this.point.x + 5, this.point.y + 5);
    ctx.font = this.font
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'black';
    ctx.fillText('Hello', this.point.x + 5, this.point.y + 5);

    ctx.moveTo(this.trackingPoint.x, this.trackingPoint.y)
    ctx.strokeStyle = '#646cff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.fill(this.icon)

    ctx.strokeStyle = '#646cff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke(this.path)
    ctx.restore()
  }
}

export const drawRectangle = (x: number, y: number, ctx: CanvasRenderingContext2D, path?: Rect2D) => {
  if (!path) {
    const key = crypto.randomUUID()
    path = new Rect2D({
      key,
      point: { x, y },
      height: 100,
      width: 100
    });

    paths.push(path)
  }

  path.draw(ctx);

  return path;
}

