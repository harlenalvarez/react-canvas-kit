import { getCanvasPoint } from '@practicaljs/canvas-kit';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import { getCanvas2DContext, getFabContext } from '..';

type ClickAwayListenerProps = {
    children: ReactNode;
    fabId: string;
    onClickAway: () => void;
};

export const ClickAwayListener = ({ children, fabId, onClickAway }: ClickAwayListenerProps) => {
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        const ctx = getCanvas2DContext()
        if(!ctx) return;
        const clickedOutside = wrapperRef.current && !wrapperRef.current.contains(event.target as Node)
        const [canvasX, canvasY] = getCanvasPoint(event.offsetX, event.offsetY, ctx, true)
        const fab = getFabContext(fabId)
        const clickedOnNode = !fab.path ? false :  ctx.isPointInPath(fab.path, canvasX, canvasY)
        if(clickedOutside && !clickedOnNode)
          onClickAway();
        
    }, [onClickAway, fabId]);

    useEffect(() => {
        // Bind the event listener
        document.addEventListener('click', handleClickOutside);
        return () => {
            // Unbind the event listener on clean up
            document.removeEventListener('click', handleClickOutside);
        };
    }, [handleClickOutside]);

    return <div ref={wrapperRef}>{children}</div>;
};

export default ClickAwayListener;
