import { canvasTransform, getCanvas2DContext, requestRedraw, useTransformSelect } from '@/index';

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
  const scale = useTransformSelect('scale')
  return (
    <>
      <button onClick={handleZoomOut}>-</button>
      <button onClick={resetZoom}>{Math.round(scale * 100)}%</button>
      <button onClick={handleZoomIn}>+</button>
    </>
  )
}