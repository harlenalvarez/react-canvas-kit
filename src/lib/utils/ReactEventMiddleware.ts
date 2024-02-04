export type ReactEventHandler<T extends React.SyntheticEvent> = (event: T) => boolean;

export class ReactEventMiddleware<T extends React.SyntheticEvent> {
  constructor(
    public handlers: Set<ReactEventHandler<T>>
  ) { }

  registerHandler = (handler: ReactEventHandler<T>) => {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    }
  }

  handleEvent = (event: T) => {
    for (const handler of this.handlers) {
      const next = handler(event);
      if (!next) break;
    }
  }
}