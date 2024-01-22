import { getDOMPoint } from '@practicaljs/canvas-kit';
import { ForwardedRef, cloneElement, forwardRef, useImperativeHandle, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { canvasTransform, getCanvas2DContext, useFabContextSelect } from '../..';

type CMCProps = {
  children: React.ReactElement,
  modalId: string,
  offsetTop: number
}

const padding = 0;
const getModalX = (x: number, modalWidth: number) => {
  return x - modalWidth/2;
}

const getModalY = (y: number, height: number, modalHeight: number, offset: number) => {
  if (y + modalHeight < height) {
    return Math.max(y - modalHeight, offset + 5);
  }
  return y - modalHeight * 2;
}

export const CanvasFabContent = forwardRef(({ children, offsetTop, modalId }: CMCProps, ref: ForwardedRef<HTMLDivElement>) => {
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
    const { height } = document.body.getBoundingClientRect();

    const mWidth = modalDimensions.width + padding;
    const mHeight = (modalDimensions.height + padding) / 2;

    const [x, y] = getDOMPoint(position.x, position.y, ctx);

    const left = getModalX(x, mWidth);
    const top = getModalY(y, height, mHeight, offsetTop);

    innerRef.current.style.left = `${left}px`;
    innerRef.current.style.top = `${top}px`;
    innerRef.current.style.position = 'relative'
  }, [position, innerRef, offsetTop, context])

  const childWithRef = cloneElement(children, { ref: innerRef })
  return <>{ childWithRef } </>
})