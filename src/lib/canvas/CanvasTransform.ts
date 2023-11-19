import { Point, clamp, getCanvasPointFromMatrix, getMidPoint } from '@practicaljs/canvas-kit';
import { PriorityQueue } from '@practicaljs/priority-queue';

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

type ShapeCoordinate = {
  id: string
  value: number
}

class CanvasTransform {
  private _scale: number = 1;
  private _offset: Point = { x: 0, y: 0 };
  readonly min = 0.1;
  readonly max = 4;

  private minX = new PriorityQueue<ShapeCoordinate>((a, b) => a.value - b.value);
  private minY = new PriorityQueue<ShapeCoordinate>((a, b) => a.value - b.value);
  private maxX = new PriorityQueue<ShapeCoordinate>((a, b) => b.value - a.value);
  private maxY = new PriorityQueue<ShapeCoordinate>((a, b) => b.value - a.value);

  get trackingEnabled() {
    return this.minX.length && this.minY.length && this.maxX.length && this.maxY.length;
  }

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
    this.offset = this.calculateOffset(ctx.getTransform(), this.scale, xPoint, yPoint);
    listeners.forEach(l => l())
  }

  /**
   * Call track shape on any canvas component you want to track, without tracking them
   * re-center and scale and recenter won't work
   * @param id unique key / id to identify the shape
   * @param x 
   * @param y 
   */
  trackShape(key: string, x: number, y: number) {
    this.minX.enqueue({ id: key, value: x });
    this.maxX.enqueue({ id: key, value: x });

    this.minY.enqueue({ id: key, value: y });
    this.maxY.enqueue({ id: key, value: y });
  }

  /**
   * Clear tracked shapes
   */
  clearTrackedShapes() {
    this.minX.clear();
    this.maxX.clear();

    this.minY.clear();
    this.maxY.clear();
  }

  /**
   * Recenter the canvas, if x or y is passed in it will recenter to that point else it will recenter in the middle
   * @param ctx 
   * @param x: number - canvas x coordinate, do not pass in a window or pointer coordinate. 
   * @param y: number - canvas y coordinate, do not pass in a window or pointer coordinate.
   * If you want to recenter around a pointer position first get the canvas point with getCanvasPoint(offsetX, offsetY, ctx)
   */
  recenter = (ctx: CanvasRenderingContext2D, x?: number, y?: number) => {
    if (x && y) {
      this.offset = this.offsetByPoint(ctx, this.scale, x, y)
    } else {
      this.offset = { x: 0, y: 0 }
      if (this.scale !== 1) {
        const matrix = this.getInitialMatrix(ctx);
        const { width, height } = ctx.canvas.getBoundingClientRect()
        const middleX = width / 2;
        const middleY = height / 2;
        this.offset = this.calculateOffset(matrix, this.scale, middleX, middleY);
      }
    }
    listeners.forEach(l => l())
  }

  /**
   * Tries to center around the content as long as there is any as it is being tracked
   * To track content call the trackShape for every Path2D shape you have created.
   * @param ctx 
   * @param scaleToFit 
   */
  recenterOnContent = (ctx: CanvasRenderingContext2D, scaleToFit: boolean = false, padding: [number, number] | number = 200) => {
    if (!this.trackingEnabled) return this.recenter(ctx);
    const top = { x: this.minX.peek.value, y: this.minY.peek.value }
    const bottom = { x: this.maxX.peek.value, y: this.maxY.peek.value }

    const middle = getMidPoint(top, bottom)

    if (!scaleToFit) {
      this.recenter(ctx, middle.x, middle.y);
      return
    }
    const scaleNeeded = this.getContentScale(ctx, padding);
    this.offset = this.offsetByPoint(ctx, scaleNeeded, middle.x, middle.y);
    this.scale = scaleNeeded
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
      transformObject.offset.x !== this.offset.x ||
      transformObject.offset.y !== this.offset.y
    ) {
      transformObject = { scale: this.scale, offset: this.offset }
    }

    return transformObject
  }

  private calculateOffset(matrix: DOMMatrix, newScale: number, xPoint: number, yPoint: number) {
    matrix.a = matrix.a / devicePixelRatio
    matrix.d = matrix.d / devicePixelRatio
    const prevRelativePoint = getCanvasPointFromMatrix(xPoint, yPoint, matrix)

    matrix.a = newScale
    matrix.d = newScale
    const currentPoint = getCanvasPointFromMatrix(xPoint, yPoint, matrix)

    const offsetX = (currentPoint[0] - prevRelativePoint[0]) * newScale;
    const offsetY = (currentPoint[1] - prevRelativePoint[1]) * newScale;

    const newOffsetX = this.offset.x + offsetX
    const newOffsetY = this.offset.y + offsetY
    return { x: newOffsetX, y: newOffsetY };
  }

  private offsetByPoint(ctx: CanvasRenderingContext2D, scale: number, x: number, y: number) {
    const { width, height } = ctx.canvas.getBoundingClientRect()

    let canvasHalfW = width / 2;
    let canvasHalfH = height / 2;

    const newViewX = x + canvasHalfW;
    const newViewY = y + canvasHalfH;

    const canvasX = (width - newViewX) * devicePixelRatio
    const canvasY = (height - newViewY) * devicePixelRatio

    const scaledDiffX = canvasX - canvasX
    const scaledDiffY = canvasY - canvasY

    let newOffset = { x: canvasX - scaledDiffX, y: canvasY - scaledDiffY }
    if (scale === 1) return newOffset;

    let matrix = this.getInitialMatrix(ctx);
    this.offset = newOffset
    return this.calculateOffset(matrix, scale, x, y)
  }

  private getInitialMatrix(ctx: CanvasRenderingContext2D) {
    const matrix = ctx.getTransform();
    matrix.a = devicePixelRatio
    matrix.d = devicePixelRatio
    matrix.e = 0;
    matrix.f = 0;
    return matrix;
  }

  private getContentScale(ctx: CanvasRenderingContext2D, padding: [number, number] | number = 200) {
    if (!this.trackingEnabled) return 1;
    const { width, height } = ctx.canvas.getBoundingClientRect()
    const contentWidth = this.maxX.peek.value - this.minX.peek.value;
    const contentHeight = this.maxY.peek.value - this.maxY.peek.value;

    const sidePadding = Array.isArray(padding) ? padding[0] : padding
    const verticalPadding = Array.isArray(padding) ? padding[1] : padding
    const actualScale = Math.min((width - sidePadding) / contentWidth, (height - verticalPadding) / contentHeight)
    // lets limit to 1, no need to zoom in
    return Math.min(1, actualScale)
  }
}

/**
 * This canvas can be used with React useExternalStoreSync
 * If want to use your store, call the subscribe method and pass in your own callback that well be called when any data is changed.
 */
export const canvasTransform = new CanvasTransform()