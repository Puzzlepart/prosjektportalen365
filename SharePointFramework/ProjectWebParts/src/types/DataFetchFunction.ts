// eslint-disable-next-line @typescript-eslint/ban-types
export interface DataFetchFunction<P = {}, R = any> {
  (props: P): Promise<R>
}
