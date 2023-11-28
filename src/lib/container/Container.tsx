import { Canvas } from '@/canvas';
import { useCanvasInteractions } from '@/hooks/useCanvasInteractions';
import { useRef } from 'react';
import styles from './Container.module.css';

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
}

const getFullScreenStyle = ({ offsetTop }: Omit<CanvasContainerProps, 'children'>) => {
  const minHeight = offsetTop ? `calc(100vh - ${offsetTop}px)` : '100vh';
  const top = offsetTop ? `${offsetTop}px` : '0';
  return { top, minWidth: '100%', minHeight } as React.CSSProperties
}

export const CanvasContainerCss = {
  container: 'RCK-Container-Layout'
}

export const CanvasContainer = ({ offsetTop, children }: CanvasContainerProps) => {
  // V1 will only support fullscreen
  const fullScreen = true
  console.log('rendeing container');
  const containerRef = useRef<HTMLDivElement>(null)
  useCanvasInteractions({
    enabled: fullScreen ?? false,
    parentRef: containerRef
  }, [containerRef])
  const layout = fullScreen ? { ...LayoutStyle, ...getFullScreenStyle({ offsetTop }) } : LayoutStyle;
  const nestedComponents = fullScreen ? getFullScreenStyle({ offsetTop }) : {};
  return (
    <div style={layout} className={CanvasContainerCss.container} ref={containerRef}>
      <section id='canvas-kit-action-section' style={nestedComponents} className={styles.main} tabIndex={1}>
        {children}
      </section>
      <section id='canvas-kit-popover-section' style={nestedComponents} className={styles.popover} tabIndex={0} />
      <section id='cavnas-kit-canvas-section' style={nestedComponents} className={styles.canvas} tabIndex={0}>
        <Canvas fullScreen={fullScreen} offsetTop={offsetTop} />
      </section>
    </div>
  );
};
