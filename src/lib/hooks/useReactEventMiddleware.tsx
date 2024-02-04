import { ReactEventHandler, ReactEventMiddleware } from '@/utils';
import { useEffect } from 'react';

export const useReactEventMiddleware = <T extends React.SyntheticEvent>(middleware: ReactEventMiddleware<T>, ...handlers: ReactEventHandler<T>[]) => {
  useEffect(() => {
    const unsubs = handlers.map(h => middleware.registerHandler(h));
    return () => {
      unsubs.forEach(u => u());
    }
  }, [middleware, handlers])
}