# Canvas React Kit

A comprehensive toolkit for handling common canvas functions in React. It
includes features like setting up the canvas, managing transformations, handling
events, and rendering popovers (coming... ).

https://github.com/harlenalvarez/react-canvas-kit/assets/12262332/61fdaf18-5c50-4b91-991b-706e8cdff062

### Getting started

First install the react canvas kit

```npm
npm i @practicaljs/react-canvas-kit
```

> This command installs the required peer dependencies. If not run
> `npm i @practicaljs/canvas-kit @practicaljs/priority-queue`

#### 1. Add Canvas Container

```tsx
import { CanvasContainer } from "@practicaljs/react-canvas-kit";

const CanvasManager = () => <div style={{ width: "100%" }}></div>;

function App() {
  return (
    <>
      <CanvasContainer>
        <CanvasManager />
      </CanvasContainer>
    </>
  );
}
```

The Canvas Container provides a singleton transform instance and event listeners
for canvas interactions.

#### 2. Create Your First Shape

Your manager component is where you'll be placing all the events listeners and
your floating action buttons

```tsx
/** new line **/
import {
  CanvasContainer,
  getCanvas2DContext,
} from "@practicaljs/react-canvas-kit";
import { getCanvasPoint } from "@practicaljs/canvas-kit";

const drawRectangle = (
  x: number,
  y: number,
  ctx: CanvasRenderingContext2D,
  path?: CanvasPath2D,
) => {
  if (!path) {
    path = new Path2D();
    path.roundRect(x, y, 100, 100, 4);
  }
  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = "#646cff";
  ctx.lineWidth = 4;
  ctx.stroke(path);
  return path;
};

const handleClick = (e: React.MouseEvent) => {
  const ctx: CanvasRenderingContext2D | null = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(
    e.nativeEvent.offsetX,
    e.nativeEvent.offsetY,
    ctx,
    false,
  );
  drawRectangle(x, y, ctx);
};

const CanvasManager = () => (
  <div style={{ width: "100%" }} onClick={handleClick}></div>
);
```

#### 3. Listen to Redraw Events

- Modify the `drawRectangle` method to store paths:

```tsx
const paths: Path2D[] = [];
const drawRectangle = (
  x: number,
  y: number,
  ctx: CanvasRenderingContext2D,
  path?: Path2D,
) => {
  if (!path) {
    path = new Path2D();
    path.roundRect(x, y, 100, 100, 4);
    // add your new path to paths
    paths.push(path);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = "#646cff";
  ctx.lineWidth = 4;
  ctx.stroke(path);

  return path;
};
```

- Import the useRedrawEvent and pass it in a redraw callback

```tsx
const redraw = () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  // loop througth every path added and call your redraw rectangle and pass in that component
  // x and y are ignored since the path already has those values
  for (let path of paths) {
    window.requestAnimationFrame(() => drawRectangle(0, 0, ctx, path));
  }
};

const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  return <div style={{ width: "100%" }}></div>;
};
```

Try scrolling and zooming using

> Built in scroll: Mouse wheel and trackpad

> Built in zoom: ctrl/⌘ +, ctrl/⌘ -, ctrl/⌘ mouse wheel

#### 4. Use the canvasTransform

To show how to start using the canvasTransform lets create a custom zoom
component. In react we'll listen to it's changes with
`useSyncExternalStore(canvasTransform.subscribe, canvasTransform.getSnapshot)`
>By the way you can also subsribe your own listener outside of react by just
calling the subscribe method directly

```tsx
import {
  canvasTransform,
  getCanvas2DContext,
  requestRedraw,
} from "@practicaljs/react-canvas-kit";
import { useSyncExternalStore } from "react";

const handleZoomOut = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.changeScale(-0.1, ctx);
  requestRedraw();
};

const handleZoomIn = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.changeScale(0.1, ctx);
  requestRedraw();
};

const resetZoom = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const change = 1 - canvasTransform.scale;
  canvasTransform.changeScale(change, ctx);
  requestRedraw();
};

export const ZoomComponent = () => {
  const { scale } = useSyncExternalStore(
    canvasTransform.subscribe,
    canvasTransform.getSnapshot,
  );
  return (
    <>
      <button onClick={handleZoomOut}>-</button>
      <button onClick={resetZoom}>{Math.round(scale * 100)}%</button>
      <button onClick={handleZoomIn}>+</button>
    </>
  );
};
```

- Update the manager component and add the new ZoomComponent

```tsx
export const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: "100%" }} onClick={handleClick}>
      <ZoomComponent />
    </div>
  );
};
```

Test it out

#### 5. Recenter and Scroll To Point

One of the most common things you will perform is to recenter or scroll to a
shape, later on we'll also do recenter on content

- Modify the manager component and add the two new methods
  1. One is to recenter in the middle of the canvas.
  2. The other will scroll the canvas to a point ( in this case I'm using the
     first shape we've created )

  > Note: This method does not reset the scale (zoom), you can do that
  > separately as in the ZoomComponent

```tsx
const recenter = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenter(ctx);
  requestRedraw();
};

const recenterOnShape = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx || !paths.length) return;
  const firstPath = paths[0];
  canvasTransform.recenter(
    ctx,
    firstPath.trackingPoint.x,
    firstPath.trackingPoint.y,
  );
  requestRedraw();
};
```

- Inside the manager component add buttons to call these methods

```tsx
export const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  return (
    <div
      style={{ width: "100%" }}
      onClick={handleClick}
      onMouseMove={checkIfInNode}
    >
      <ZoomComponent />
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
    </div>
  );
};
```

#### 6. Track Content

One popular action is to recenter the canvas around content and also scale to
fit, for this we'll need to track the shapes created.

- First lets change our drawRectangle to take in a CanvasPath2D instead of
  Path2D, it's a class that requires key and track point. Technically you don't
  need to use this class as long as you generate a key and keep track of the
  point somehow.

```tsx
import { CanvasPath2D } from "@practicaljs/react-canvas-kit";

const paths: CanvasPath2D[] = [];
const drawRectangle = (
  x: number,
  y: number,
  ctx: CanvasRenderingContext2D,
  path?: CanvasPath2D,
) => {
  if (!path) {
    const key = crypto.randomUUID();
    path = new CanvasPath2D({
      key,
      trackingPoint: { x: x + 50, y: y + 50 },
    });
    path.roundRect(x, y, 100, 100, 4);
    paths.push(path);
  }

  ctx.restore();
  ctx.beginPath();
  ctx.strokeStyle = "#646cff";
  ctx.lineWidth = 4;
  ctx.stroke(path);

  return path;
};
```

For the tracking point you can choose x or y, but I want to treat the center of
my rectangle as the tracking point.

- Modify the handleClick event so after each rectangle creation let the
  transform know you want to track that object by calling
  `canvasTransform.trackShape`

```tsx
const handleClick = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const [x, y] = getCanvasPoint(
    e.nativeEvent.offsetX,
    e.nativeEvent.offsetY,
    ctx,
    false,
  );
  const path = drawRectangle(x, y, ctx);
  canvasTransform.trackShape(
    path.key,
    path.trackingPoint.x,
    path.trackingPoint.y,
  );
};
```

- Add 2 new methods to recenter on content and scale to fit The transform
  function is the same with a boolean to also scale to fit,

```tsx
const recenterOnContent = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, false);
  requestRedraw();
};

const scaleToFit = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  canvasTransform.recenterOnContent(ctx, true);
  requestRedraw();
};
```

- Modify the manager container by adding two new buttons

```tsx
export const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  return (
    <div
      style={{ width: "100%" }}
      onClick={handleClick}
      onMouseMove={checkIfInNode}
    >
      <ZoomComponent />
      <button onClick={recenter}>Recenter</button>
      <button onClick={recenterOnShape}>Recenter Shape</button>
      <button onClick={recenterOnContent}>Recenter around content</button>
      <button onClick={scaleToFit}>Recenter around content and scale</button>
    </div>
  );
};
```

#### 7. Canvas Floating Action Buttons

The `<CanvasFab {...props} />` element allows for regular dom elements to be
placed on top of canvas components like toolbars.

1. Start by creating your CanvasFab container after your static canvas FAB
   layout.

```tsx
const CanvasManager = (props) => {
  return (
    <>
      <div
        style={{ width: "100%" }}
        onClick={handleClick}
      >
        {/*rest of code */}
      </div>
      <CanvasFab
        fabId="fab-id"
        offsetTop={50}
        orientation="horizontal"
        placement="top"
      >
        <ButtonGroup>
          <Button onClick={() => console.log("Option 1")}>Option 1</Button>
          <Button>Option 2</Button>
        </ButtonGroup>
      </CanvasFab>
    </>
  );
};
```

> The fabId to allow for multiple types of fabs, but only one can be active at a
> time.

2. Opening the Fab. Listen to your path click event and pass in the x y
   coordinates of the shape. Ideally you want the X value to be in the center of
   the shape if rendering top or bottom, and your y to be at the top or bottom
   of your shape with some margin. If showing a vertical tool bar then then
   opposite.

```tsx
const checkIfInNode = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return null;
  const clientX = e.nativeEvent.offsetX;
  const clientY = e.nativeEvent.offsetY;
  const [x, y] = getCanvasPoint(clientX, clientY, ctx, true);
  for (const path of paths) {
    if (ctx.isPointInPath(path.path, x, y)) {
      return path;
    }
  }
  return null;
};

const onClick = (e: React.MouseEvent) => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  const clickedPath = checkIfInNode(e);
  const modal = getFabContext("fab-id");
  modal.openFab({
    // the y coordinate has a 10 padding ( is minus because we are rendering on the top )
    position: { x: clickedPath.trackingPoint.x, y: clickedPath.point.y - 10 },
    key: clickedPath.key,
    path: clickedPath.path,
  });
  return;
};
```

> Like any other method in this library, we opted to use services to allow for
> use outside of react.

3. Placement options. Canvas Fab allows for orientation and placement to be
   passed. The default values are horizontal and top for rendering a horizontal
   FAB at the top of the element, but if you want to change the placement you
   would have to add either the width or height to your coordidnates. Here are
   some examples

```tsx
// for horizontal and top
modal.openFab({
  position: { x: clickedPath.trackingPoint.x, y: clickedPath.point.y - 10 },
  ...rest,
});
// horizontal and bottom
modal.openFab({
  position: {
    x: clickedPath.trackingPoint.x,
    y: clickedPath.point.y + clickedPath.width + 10,
  },
  ...rest,
});
// vertical and left
modal.openFab({
  position: { x: clickedPath.point.x - 10, y: clickedPath.trackingPoint.y },
  ...rest,
});
// vertical and right
modal.openFab({
  position: {
    x: clickedPath.point.x + clickedPath.width + 10,
    y: clickedPath.trackingPoint.y,
  },
  ...rest,
});
```

4. Dragging shapes. Canvas Fab listens to transform events, but in the event you
   support dragging of individual shapes, make sure to notify fab context that
   the shape position has changed.

```tsx
const fab = getFabContext("fab-id");
if (fab.open && fab.key === path.key) {
  // make sure the fab point matches the open fab point logic
  const fabPoint = {
    x: path.trackingPoint.x,
    y: path.point.y + path.width + 10,
  };
  fab.changeFabPosition(fabPoint);
}
```

5. To close just call the close method

```tsx
const context = getFabContext("one-and-only");
context.close();
```

> We have a click outside listener that will automatically close when clicking
> outside the element or the FAB container

You've successfully set up and explored the Canvas React Kit. Feel free to
explore further and customize the Canvas React Kit for your project needs. If
you have questions, you can always reach out to me on twitter @AlvarezHarlen.
Happy coding!

### Next steps

I'll be adding the popover section to give you an easy to use api to render
popover dom elements
