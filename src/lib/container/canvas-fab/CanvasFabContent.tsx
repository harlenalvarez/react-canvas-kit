import { getDOMPoint } from '@practicaljs/canvas-kit';
import { ForwardedRef, cloneElement, forwardRef, useImperativeHandle, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { canvasTransform, getCanvas2DContext, useFabContextSelect } from '../..';

type CMCProps = {
  children: React.ReactElement,
  modalId: string,
  offsetTop: number,
  orientation: 'horizontal' | 'vertical',
  placement: 'top' | 'bottom' | 'right' | 'left'
}

const getModalX = (x: number, modalWidth: number, orientation: CMCProps['orientation'], placement: CMCProps['placement']) => {
  console.log(orientation, placement)
  if(orientation === 'vertical' && placement === 'left') return x;
  return x - modalWidth;
}

const getModalY = (y: number, modalHeight: number, orientation: CMCProps['orientation'], placement: CMCProps['placement']) => {
  if(orientation === 'horizontal' && placement === 'bottom') return y;
  return y - modalHeight;
}

export const CanvasFabContent = forwardRef(({ children, offsetTop, modalId, orientation, placement }: CMCProps, ref: ForwardedRef<HTMLDivElement>) => {
  const context = useSyncExternalStore(canvasTransform.subscribe, canvasTransform.getSnapshot)
  const innerRef = useRef<HTMLDivElement>(null);
  const position = useFabContextSelect(modalId, 'position')
  useImperativeHandle(ref, () => innerRef.current!);

  useLayoutEffect(() => {
    if (!innerRef?.current || !position) return;
    const ctx = getCanvas2DContext();
    if(!ctx) return;
    const modalDimensions = innerRef.current.getBoundingClientRect();
    if (!modalDimensions) return;


    const mWidth = orientation === 'horizontal' ? modalDimensions.width / 2 : modalDimensions.width;
    const mHeight = orientation === 'vertical' ? modalDimensions.height / 2 : modalDimensions.height;

    const [x, y] = getDOMPoint(position.x, position.y, ctx);

    const left = getModalX(x, mWidth, orientation, placement);
    const top = getModalY(y, mHeight, orientation, placement) + offsetTop;

    innerRef.current.style.left = `${left}px`;
    innerRef.current.style.top = `${top}px`;
    innerRef.current.style.position = 'relative'
  }, [position, innerRef, offsetTop, context, orientation, placement])

  const childWithRef = cloneElement(children, { ref: innerRef })
  return <>{ childWithRef } </>
})