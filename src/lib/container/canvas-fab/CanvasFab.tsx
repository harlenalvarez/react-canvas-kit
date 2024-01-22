import { useFabContextSelect } from '../..';
import { CanvasFabPortal } from './CanvasFabPortal';

export type CanvasModalProps = {
  fabId: string,
  children: React.ReactElement,
  offsetTop: number,
  orientation?: 'horizontal' | 'vertical'
  placement?: 'top' | 'bottom' | 'right' | 'left'
}
export const CanvasFab = ({ fabId, children, offsetTop, orientation, placement }: CanvasModalProps) => {
  const open = useFabContextSelect(fabId, 'open');
  if (!open) return null;
  return (
    <CanvasFabPortal fabId={fabId} offsetTop={offsetTop} orientation={orientation} placement={placement}>
      {children}
    </CanvasFabPortal>
  )
}