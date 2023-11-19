# Canvas React Kit
A set of the most common canvas functions, like setting up the canvas, maintaing the transform, handling translation and scalling (zoom), listening to the typical keyboard, mouse and pointer events.  Providing built in methods like recentering, recentering and scaling based on content, translating pointer coordinates to canvas coordinates. It also comes with a popover system where you can choose to render normal react elements as popovers over your shapes. And finally handling rendering across different screens resolutions.

The kit is not a wrapper around the canvas api, and as you'll see in the examples you normally access the 2d Context yourself so you'll have full control and full access to all the Canvas API functions.
### Getting started

First install the react canvas kit

```npm
npm i @practicaljs/react-canvas-kit
```
> This should also install the peer dependencies, if not run npm i @practicaljs/canvas-kit


Create your canvas component like so

```tsx
import { CanvasContainer } from '@practicaljs/react-canvas-kit'

const Actions = () => {
  return (
    <div style={{ width: '100%' }}></div>
  )
}

function App() {
  return (
    <>
      <CanvasContainer>
        <Actions />
      </CanvasContainer>
    </>
  )
}
```

The canvas container will provide the basics in the form a a singleton transform instance.
It will also provide an event listener to redraw your canvas shapes on transform changes, like tranlation and scaling.
By default it will also listen to the basic canvas keyboard and mouse events events you typically find in tools like Figma and Excalidraw.


Now that you hace an action container create your first shape by listening to a click event


The nest thing we need to add is a listener for when redraw requests are made by the canvas element for example when changing it's translate or scale.
```tsx
/** new line **/
import { CanvasContainer, getCanvas2DContext} from '@practicaljs/react-canvas-kit'

const drawRectangle = (x: number, y: number, ctx: CanvasRenderingContext2D, path?: CanvasPath2D) => {
  if (!path) {
    path = new Path2D()
    path.roundRect(x, y, 100, 100, 4);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = '#646cff';
  ctx.lineWidth = 4;
  ctx.stroke(path);

  return path;
}

import { getCanvasPoint } from '@practicaljs/canvas-kit';
const handleClick = (e: React.MouseEvent) => {
  const ctx: CanvasRenderingContext2D | null = getCanvas2DContext();
  if (!ctx) return;
  // get the canvas point off your click coordinates
  // instead of clientX and clientY consider using offset to account for any padding
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  // draw your shape
  drawRectangle(x, y, ctx);
}
/** end of new line **/
const Actions = () => {
  return (
    <div 
    style={{ width: '100%' }} 
    /** new **/
    onClick={handleClick}
    /** end **/
    ></div>
  )
}
```


You might have noticed that on scroll or zoom the canvas is clearing.  Every time those operations occur the canvas clears itself, sets the transform and notifies listeners to redraw their shapes.  First modify the drawRectangle to store all the paths added.

>When redrawing do now worry about chaging your x, y coordinates or scale, the canvas handles that for you.

```tsx
const paths: Path2D[] = []
const drawRectangle = (x: number, y: number, ctx: CanvasRenderingContext2D, path?: Path2D) => {
  if (!path) {
    path = new Path2D()
    path.roundRect(x, y, 100, 100, 4);
    // add your new path to paths
    paths.push(path);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = '#646cff';
  ctx.lineWidth = 4;
  ctx.stroke(path);

  return path;
}
```

```tsx
const redraw = () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  // loop througth every path added and call your redraw rectangle and pass in that component
  // x and y are ignored since the path already has those values
  for (let path of paths) {
    window.requestAnimationFrame(() => drawRectangle(0, 0, ctx, path))
  }
}


const Actions = () => {
  // this hook will call any callback provided
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: '100%' }}></div>
  )
}
```
Try scrolling and zooming using
> Built in scroll: Mouse wheel and trackpad

> Built in zoom: ctrl/⌘ +, ctrl/⌘ -, ctrl/⌘ mouse wheel

Now you should be able to scroll and zoom without loosing state
Next lets create a zoom in and out button, this will show you how to use the canvas transform in react and how to call in their methods

First create a ZoomComponent

```tsx
import { canvasTransform, getCanvas2DContext, requestRedraw } from '@practicaljs/react-canvas-kit';
import { useSyncExternalStore } from 'react';

const handleZoomOut = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.changeScale(-0.1, ctx)
  requestRedraw()
}

const handleZoomIn = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.changeScale(0.1, ctx)
  requestRedraw()
}

const resetZoom = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const change = 1 - canvasTransform.scale
  canvasTransform.changeScale(change, ctx)
  requestRedraw()
}

export const ZoomComponent = () => {
  const { scale } = useSyncExternalStore(canvasTransform.subscribe, canvasTransform.getSnapshot)
  return (
    <>
      <button onClick={handleZoomOut}>-</button>
      <button onClick={resetZoom}>{Math.round(scale * 100)}%</button>
      <button onClick={handleZoomIn}>+</button>
    </>
  )
}
```

