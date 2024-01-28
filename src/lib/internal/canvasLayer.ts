export const canvasLayer = {
  internal: 'pj-inernal-react-canvas-kit-canvas-element',
  top: 'pj-top-react-canvas-kit-canvas-element',
  main: 'pj-main-react-canvas-kit-canvas-element'
}
export const getCanvasElement = (id: string) => document.getElementById(id) as HTMLCanvasElement | null