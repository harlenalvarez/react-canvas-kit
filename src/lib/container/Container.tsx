import { Canvas } from '@/canvas';
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions';
import { useLayoutEffect, useMemo, useRef } from 'react';
import styles from './Container.module.css';
import { CanvasContainerCss } from './Container.types';
import { Scrollbars } from './Scrollbars';

const LayoutStyle: React.CSSProperties = {
  zIndex: '0',
  position: 'relative'
}

export type CanvasContainerProps = {
  children: React.ReactNode
  /**
   * Use the offset to let the container know if you have a static positioned navbar, only needed in full screen mode
   */
  offsetTop?: number,
  fullScreen?: boolean,
  includeScrollBars?: boolean,
}

const getFullScreenStyle = ({ offsetTop }: Omit<CanvasContainerProps, 'children'>) => {
  const minHeight = offsetTop ? `calc(100vh - ${offsetTop}px)` : '100vh';
  const top = offsetTop ? `${offsetTop}px` : '0';
  return { top, minWidth: '100%', minHeight } as React.CSSProperties
}

export const CanvasContainer = ({ offsetTop, children, includeScrollBars }: CanvasContainerProps) => {
  // V1 will only support fullscreen
  const fullScreen = true
  const containerRef = useRef<HTMLDivElement>(null)
  useCanvasInteractions({
    enabled: fullScreen ?? false,
    parentRef: containerRef
  });

  const layout = useMemo(() => fullScreen ? { ...LayoutStyle, ...getFullScreenStyle({ offsetTop }) } : LayoutStyle, [fullScreen, offsetTop]);
  const nestedComponents = fullScreen ? getFullScreenStyle({ offsetTop }) : {};

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const doc = document.getElementsByClassName(CanvasContainerCss.container);
    if (doc.length) {
      const { top } = doc[0].getBoundingClientRect();
      if (offsetTop && top !== offsetTop) {
        const topDiff = top - offsetTop;
        containerRef.current.style.top = `${offsetTop - topDiff}px`;
      }
    }
  }, [containerRef, layout, offsetTop]);

  return (
    <>
      <div id='canvas-kit-main-container' style={layout} className={CanvasContainerCss.container} ref={containerRef}>
        <section id='canvas-kit-action-section' style={nestedComponents} className={styles.main} tabIndex={1}>
          {children}
        </section>
        <section id='canvas-kit-popover-section' style={nestedComponents} className={styles.popover} tabIndex={0} />
        <section id='canvas-kit-canvas-section' style={nestedComponents} className={styles.canvas} tabIndex={0}>
          <Canvas fullScreen={fullScreen} offsetTop={offsetTop} />
          {includeScrollBars && <Scrollbars />}
        </section>
      </div>
      <div className={styles.modalContainer} id='rck-canvas-portal-container' />
    </>
  );
};
