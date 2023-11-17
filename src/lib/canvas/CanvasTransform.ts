import { Point, clamp, getCanvasPointFromMatrix } from '@practicaljs/canvas-kit';

let listeners = new Set<() => void>();
let transformObject = {
  scale: 1,
  offset: { x: 0, y: 0 }
}

// TODO: move to canvas-kit
export const screenToWorld = (currentMatrix: DOMMatrix, x: number, y: number): Point => {
  // Apply the inverse matrix to the screen coordinates
  const worldX = currentMatrix.a * x + currentMatrix.c * y + currentMatrix.e;
  const worldY = currentMatrix.b * x + currentMatrix.d * y + currentMatrix.f;

  return { x: worldX, y: worldY };
}

const roundToNearestTenThousandth = (number: number) => {
  return Math.round(number * 10000) / 10000;
}

class CanvasTransform {
  private _scale: number = 1;
  private _offset: Point = { x: 0, y: 0 };
  readonly min = 0.1;
  readonly max = 4;

  get scale() {
    return this._scale;
  }

  set scale(value: number) {
    this._scale = clamp(value, this.min, this.max);
  }

  get offset() {
    return this._offset;
  }

  set offset(value: Point) {
    this._offset = { ...value };
  }

  changeOffset(deltaX: number, deltaY: number) {
    const x = this.offset.x - deltaX;
    const y = this.offset.y - deltaY;
    this.offset = { x, y };

    listeners.forEach(l => l());
  }

  changeScale(value: number, ctx: CanvasRenderingContext2D, x?: number, y?: number) {
    const prevScale = this.scale;
    this.scale = roundToNearestTenThousandth(this.scale + value);
    const delta = roundToNearestTenThousandth(this.scale - prevScale);
    if (!delta) return;
    const { width, height } = ctx.canvas.getBoundingClientRect()
    const xPoint = x ?? width / 2
    const yPoint = y ?? height / 2
    const matrix = ctx.getTransform();

    matrix.a = prevScale
    matrix.d = prevScale

    const prevRelativePoint = getCanvasPointFromMatrix(xPoint, yPoint, matrix)//getCanvasPointFromMatrix(width, height, matrix);
    matrix.a = this.scale
    matrix.d = this.scale

    const currentPoint = getCanvasPointFromMatrix(xPoint, yPoint, matrix)

    const offsetX = (currentPoint[0] - prevRelativePoint[0]) * this.scale;
    const offsetY = (currentPoint[1] - prevRelativePoint[1]) * this.scale;

    const newOffsetX = this.offset.x + offsetX
    const newOffsetY = this.offset.y + offsetY
    this.offset = { x: newOffsetX, y: newOffsetY }
    listeners.forEach(l => l())
  }

  /**
   * 
   * @param listener - Callback method to notify something has changed
   * @returns - Method to unsubscribe the callback
   */
  subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    }
  }

  getSnapshot = () => {
    if (
      transformObject.scale !== this._scale ||
      transformObject.offset.x !== this._offset.x ||
      transformObject.offset.y !== this._offset.y
    ) {
      transformObject = { scale: this.scale, offset: this._offset }
    }

    return transformObject
  }
}

/**
 * This canvas can be used with React useExternalStoreSync
 * If want to use your store, call the subscribe method and pass in your own callback that well be called when any data is changed.
 */
export const canvasTransform = new CanvasTransform()