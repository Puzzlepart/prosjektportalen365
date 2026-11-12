/** Contract for a component's logic hook. */
export interface ComponentLogicHook<P = {}, R = any> {
  (props: P): R
}
