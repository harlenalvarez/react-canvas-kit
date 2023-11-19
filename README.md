# Canvas React Kit
A comprehensive toolkit for handling common canvas functions in React. It includes features like setting up the canvas, managing transformations, handling events, and rendering popovers (coming... ).

https://github.com/harlenalvarez/react-canvas-kit/assets/12262332/61fdaf18-5c50-4b91-991b-706e8cdff062

### Getting started

First install the react canvas kit

```npm
npm i @practicaljs/react-canvas-kit
```
>This command installs the required peer dependencies. If not run 
```npm i @practicaljs/canvas-kit @practicaljs/priority-queue```


#### 1. Add Canvas Container

```tsx
import { CanvasContainer } from '@practicaljs/react-canvas-kit'

const Actions = () => (<div style={{ width: '100%' }}></div>)

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
The Canvas Container provides a singleton transform instance and event listeners for canvas interactions.


#### 2. Create Your First Shape

Your actions component is where you'll be placing all the events listeners and your floating action buttons
```tsx
/** new line **/
import { CanvasContainer, getCanvas2DContext} from '@practicaljs/react-canvas-kit'
import { getCanvasPoint } from '@practicaljs/canvas-kit';

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

const handleClick = (e: React.MouseEvent) => {
  const ctx: CanvasRenderingContext2D | null = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  drawRectangle(x, y, ctx);
}

const Actions = () => (<div style={{ width: '100%' }} onClick={handleClick}></div>)
```

#### 3. Listen to Redraw Events

* Modify the `drawRectangle` method to store paths:
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
* Import the useRedrawEvent and pass it in a redraw callback
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
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: '100%' }}></div>
  )
}
```
Try scrolling and zooming using
> Built in scroll: Mouse wheel and trackpad

> Built in zoom: ctrl/⌘ +, ctrl/⌘ -, ctrl/⌘ mouse wheel

#### 4. Use the canvasTransform
To show how to start using the canvasTransform lets create a custom zoom component.
In react we'll listen to it's changes with
```useSyncExternalStore(canvasTransform.subscribe, canvasTransform.getSnapshot)```
>By the way you can also subsribe your own listener outside of react by just calling the subscribe method directly

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
* Update the action component and add the new ZoomComponent

```tsx
export const ActionContainer = () => {
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: '100%' }} onClick={handleClick}>
      <ZoomComponent />
    </div>
  )
}
```
Test it out

#### 5. Recenter and Scroll To Point
One of the most common things you will perform is to recenter or scroll to a shape, later on we'll also do recenter on content

* Modify the actions file and add the two new methods
   1. One is to recenter in the middle of the canvas.
   2. The other will scroll the canvas to a point ( in this case I'm using the first shape we've created )

   >Note: This method does not reset the scale (zoom), you can do that separately as in the ZoomComponent
```tsx
const recenter = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenter(ctx);
  requestRedraw()
}

const recenterOnShape = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx || !paths.length) return;
  const firstPath = paths[0]
  canvasTransform.recenter(ctx, firstPath.trackingPoint.x, firstPath.trackingPoint.y);
  requestRedraw();
}
```
* Inside the Action component add buttons to call these methods
```tsx
export const ActionContainer = () => {
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: '100%' }} onClick={handleClick} onMouseMove={checkIfInNode}>
      <ZoomComponent />
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
    </div>
  )
}
```

#### 6. Track Content
One popular action is to recenter the canvas around content and also scale to fit, for this we'll need to track the shapes created.

* First lets change our drawRectangle to take in a CanvasPath2D instead of Path2D, it's a class that requires key and track point. Technically you don't need to use this class as long as you generate a key and keep track of the point somehow.
```tsx
import { CanvasPath2D } from '@practicaljs/react-canvas-kit';

const paths: CanvasPath2D[] = []
const drawRectangle = (x: number, y: number, ctx: CanvasRenderingContext2D, path?: CanvasPath2D) => {
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

  return path;
}
```
For the tracking point you can choose x or y, but I want to treat the center of my rectangle as the tracking point.

* Modify the handleClick event so after each rectangle creation let the transform know you want to track that object
by calling ```canvasTransform.trackShape```
```tsx
const handleClick = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, false);
  const path = drawRectangle(x, y, ctx);
  canvasTransform.trackShape(path.key, path.trackingPoint.x, path.trackingPoint.y);
}
```

* Add 2 new methods to recenter on content and scale to fit
The transform function is the same with a boolean to also scale to fit, 
```tsx
const recenterOnContent = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, false);
  requestRedraw()
}

const scaleToFit = (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, true)
  requestRedraw()
}
```

* Modify the Actions container by adding two new buttons
```tsx
export const ActionContainer = () => {
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: '100%' }} onClick={handleClick} onMouseMove={checkIfInNode}>
      <ZoomComponent />
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
      <button onClick={recenterOnContent}>Recenter around content</button>
      <button onClick={scaleToFit}>Recenter around content and scale</button>

    </div>
  )
}
```
You've successfully set up and explored the Canvas React Kit. Feel free to explore further and customize the Canvas React Kit for your project needs. If you have questions, you can always reach out to me on twitter @AlvarezHarlen. Happy coding!

### Next steps
I'll be adding the popover section to give you an easy to use api to render popover dom elements

