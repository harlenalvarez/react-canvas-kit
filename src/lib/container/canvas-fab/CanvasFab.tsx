import { useFabContextSelect } from '../..';
import { CanvasFabPortal } from './CanvasFabPortal';

export type CanvasModalProps = {
  fabId: string,
  children: React.ReactElement,
  offsetTop: number,
}
export const CanvasFab = ({ fabId, children, offsetTop }: CanvasModalProps) => {
  const open = useFabContextSelect(fabId, 'open');
  if (!open) return null;
  return (
    <CanvasFabPortal fabId={fabId} offsetTop={offsetTop}>
      {children}
    </CanvasFabPortal>
  )
}