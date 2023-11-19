import { Point } from '@practicaljs/canvas-kit'

export class CanvasPath2D extends Path2D {
  key: string
  /**
   * This point is used by the transform to track your shapes, normaly you would want it to be the middle of the shape
   * In a circle it would be the {x, y} coordinate you use for ctx.arc(x, y,...rest)
   * In a rectangle it would be { x + (width/2), y + (width/2)}
   */
  trackingPoint: Point
  constructor(canvasPoint: Pick<CanvasPath2D, 'key' | 'trackingPoint'>, path?: string | Path2D | undefined) {
    super(path)
    this.key = canvasPoint.key
    this.trackingPoint = canvasPoint.trackingPoint
  }
}