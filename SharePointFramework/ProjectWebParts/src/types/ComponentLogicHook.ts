// eslint-disable-next-line @typescript-eslint/ban-types
export interface ComponentLogicHook<P = {}, R = any> {
  (props: P): R
}
