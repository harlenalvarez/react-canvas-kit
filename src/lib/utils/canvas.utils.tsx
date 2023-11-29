import { clearCanvas } from '@practicaljs/canvas-kit'

export const clearAll = (ctx: CanvasRenderingContext2D) => {
  const transform = ctx.getTransform()
  clearCanvas(ctx, transform.a, {x: transform.e, y: transform.f})
}