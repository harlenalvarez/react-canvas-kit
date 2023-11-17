export const paths: Path2D[] = []
export const drawRectangle = (x: number, y: number, ctx: CanvasRenderingContext2D, path?: Path2D) => {
  if (!path) {
    path = new Path2D();
    path.roundRect(x, y, 100, 100);
    paths.push(path);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = '#646cff';
  ctx.lineWidth = 4;
  ctx.stroke(path);
}
