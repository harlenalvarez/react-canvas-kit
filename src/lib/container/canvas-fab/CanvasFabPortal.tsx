import { createPortal } from 'react-dom'
import { CanvasModalProps } from '..'
import ClickAwayListener from '../ClickAwayListener'
import { CanvasFabContent } from './CanvasFabContent'
import { getFabContext } from './CanvasFabContext'

export const CanvasFabPortal = ({ fabId, children, offsetTop, orientation, placement }: CanvasModalProps) => {
  const context = getFabContext(fabId)
  const parent = document.getElementById('rck-canvas-portal-container') as HTMLDivElement
  return createPortal(
    <ClickAwayListener onClickAway={context.close} fabId={fabId}>
      <CanvasFabContent offsetTop={offsetTop} modalId={fabId} orientation={orientation ?? 'horizontal'} placement={placement ?? 'top'}>
        {children}
      </CanvasFabContent>
    </ClickAwayListener>,
    parent
  )
}