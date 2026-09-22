export interface ComponentLogicHook<P = {}, R = any> {
  (props: P): R
}
