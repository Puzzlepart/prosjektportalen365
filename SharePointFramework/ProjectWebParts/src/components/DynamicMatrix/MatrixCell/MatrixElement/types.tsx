export interface IMatrixElementModel<T = any> {
  item: T
  id: number | string
  tooltip: string
}

export interface IMatrixElementProps extends React.HTMLProps<HTMLDivElement> {
  model: IMatrixElementModel<any>
}
