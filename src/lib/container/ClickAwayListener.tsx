import { getCanvasPoint } from '@practicaljs/canvas-kit';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { getCanvas2DContext, useFabContextSelect } from '..';

type ClickAwayListenerProps = {
    children: ReactNode;
    fabId: string;
    onClickAway: () => void;
};

export const ClickAwayListener = ({ children, fabId, onClickAway }: ClickAwayListenerProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const path = useFabContextSelect(fabId, 'path');

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const ctx = getCanvas2DContext()
        if(!ctx) return;
        const clickedOutside = wrapperRef.current && !wrapperRef.current.contains(event.target as Node)
        const [canvasX, canvasY] = getCanvasPoint(event.offsetX, event.offsetY, ctx, true)
        const clickedOnNode = !path ? false :  ctx.isPointInPath(path, canvasX, canvasY)
        if(clickedOutside && !clickedOnNode)
          onClickAway();
        
    }, [onClickAway, path]);

    useEffect(() => {
        // Bind the event listener
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    return <div ref={wrapperRef}>{children}</div>;
};

export default ClickAwayListener;
