import { canvasLayer, getCanvasElement } from '@/internal';
import { clearCanvas } from '@practicaljs/canvas-kit';

export const clearAll = (ctx: CanvasRenderingContext2D) => {
  const transform = ctx.getTransform()
  clearCanvas(ctx, transform.a, { x: transform.e, y: transform.f })
}

export const getCanvas2DContext = (layer?: keyof typeof canvasLayer, inCanvas?: HTMLCanvasElement | null): CanvasRenderingContext2D | null => {
  const targetLayer = layer ? canvasLayer[layer] : canvasLayer.main;
  const canvas = inCanvas ?? getCanvasElement(targetLayer);
  if (!canvas) return null;
  return canvas.getContext('2d');
}