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


You might have noticed that on scroll or zoom the canvas is clearing, the canvas is changing the transform and once is done it notifies listeners that they need to redraw their shapes.

>When redrawing do now worry about chaging your x, y coordinates or scale, the canvas handles that for you.

```tsx
// Depending on your use case you can bring the redraw into your react component
// but since mine is pure I'll keep it outside
const redraw = () => {}

const Actions = () => {
  // this hook will call any callback provided
  // this events are callbacks and don't use event or broadcast channels but you can add it in your redraw
  useRedrawEvent(redraw, []);
  return (
    <div style={{ width: '100%' }}></div>
  )
}
```

#### Documentation in progress...

