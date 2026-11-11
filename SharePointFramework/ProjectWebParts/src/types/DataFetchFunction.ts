export interface DataFetchFunction<P = {}, R = any> {
  (props: P): Promise<R>
}
