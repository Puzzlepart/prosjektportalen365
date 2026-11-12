/** Contract for an asynchronous component data loader. */
export interface DataFetchFunction<P = {}, R = any> {
  (props: P): Promise<R>
}
