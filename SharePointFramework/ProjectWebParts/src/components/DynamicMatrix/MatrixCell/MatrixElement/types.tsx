/** Identifies a matrix element and supplies its tooltip data. */
export interface IMatrixElementModel<T = any> {
  item: T
  id: number | string
  tooltip: string
}

/** Configures a matrix badge and its visibility. */
export interface IMatrixElementProps extends React.HTMLProps<HTMLDivElement> {
  model: IMatrixElementModel<any>
}
