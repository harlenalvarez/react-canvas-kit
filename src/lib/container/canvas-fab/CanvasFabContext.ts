import { Point } from '@practicaljs/canvas-kit';

const canvasModalSubs = new Set<() => void>();
let snapshot: { open: boolean, position: Point | null } = {
  open: false,
  position: null
}
class CanvasFabContext {
  private _open: boolean = false;
  private _position: Point | null = null;
  private _path: Path2D | null = null;
  private _key: string | null = null;
  private onClose? = () => { }

  get open() {
    return this._open;
  }

  get position(): Point | null {
    return this._position;
  }

  get path(): Path2D | null {
    return this._path;
  }

  get key(): string | null {
    return this._key;
  }

  close = () => {
    this._position = null;
    this._open = false;
    this._key = null;
    this.notify();
    if (this.onClose) {
      this.onClose();
      this.onClose = undefined;
    }
  }

  /**
   * 
   * @param param0 { position } - The position of the Fab on canvas in DOM coordinates (not pixels), ideally you would want y to be the center and y the top of the shape
   * @param param1 {{ key }} - The unique identifier for the Fab (used to close it)
   * @param param2 {{ path }} - The Path to draw on canvas
   */
  openFab = ({ position, key, path, onClose }: { position: Point, key: string, path: Path2D, onClose?: () => void }) => {
    this.onClose = onClose;
    this._open = true;
    this._position = position;
    this._path = path;
    this._key = key;
    this.notify();
  }

  changeFabPosition = (point: Point, path: Path2D) => {
    const pointToChange = { ...point };
    this._position = pointToChange
    this._path = path;
    this.notify();
  }

  private notify = () => {
    canvasModalSubs.forEach(l => l());
  }

  subscribe = (l: () => void) => {
    canvasModalSubs.add(l);
    return () => {
      canvasModalSubs.delete(l);
    }
  }

  getSnapshot = () => {
    if (snapshot.open !== this.open || snapshot.position?.x !== this.position?.x || snapshot.position?.y !== this.position?.y) {
      snapshot = {
        open: this._open,
        position: this._position
      }
    }
    return snapshot;
  }
}


export type CanvasFabContextType = CanvasFabContext

const fabContextMap = new Map<string, CanvasFabContext>();
export const getFabContext = (id: string) => {
  if (!fabContextMap.has(id)) {
    fabContextMap.set(id, new CanvasFabContext())
  }
  return fabContextMap.get(id)!;
}
