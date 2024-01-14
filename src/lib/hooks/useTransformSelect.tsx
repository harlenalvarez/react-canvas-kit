import { useCallback, useEffect, useState } from 'react';
import { CanvasTransformManager, canvasTransform } from '..';


type CanvasTransformKeys = Pick<CanvasTransformManager, 'scale'|'offset'>;

export function useTransformSelect<T extends keyof CanvasTransformKeys>(transformValue: T): CanvasTransformManager[T] {
  const [selectValue, setSelectValue] = useState<CanvasTransformManager[T]>(canvasTransform[transformValue])

  const onChange = useCallback(() => {
    if(selectValue !== canvasTransform[transformValue]) {
      setSelectValue(canvasTransform[transformValue])
    }
  }, [selectValue, transformValue])

  useEffect(() => {
    const unsub = canvasTransform.subscribe(onChange);
    return () => {
      unsub();
    }
  }, [onChange])

  return selectValue
}
