import { useCallback, useEffect, useState } from 'react';
import { CanvasFabContextType, getFabContext } from '..';


type CanvasModelContextKeys = Pick<CanvasFabContextType, 'open' | 'position' | 'path'>;

export function useFabContextSelect<T extends keyof CanvasModelContextKeys>(fabId: string, modalProperty: T): CanvasFabContextType[T] {
  const context = getFabContext(fabId);
  const [selectValue, setSelectValue] = useState<CanvasFabContextType[T]>(context[modalProperty])

  const onChange = useCallback(() => {
      setSelectValue(context[modalProperty])
  }, [modalProperty, context])

  useEffect(() => {
    const unsub = context.subscribe(onChange);
    return () => {
      unsub();
    }
  }, [onChange, context, selectValue])

  return selectValue
}
