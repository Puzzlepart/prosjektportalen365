import { CSSProperties, HTMLProps } from 'react'

export enum MatrixCellType {
  Header,
  Cell
}

export interface IMatrixCell {
  cellType: MatrixCellType
  cellValue?: string
  className?: string
  style?: CSSProperties
  x?: number
  y?: number
}

export interface IMatrixCellProps extends HTMLProps<HTMLDivElement> {
  cell?: IMatrixCell
}
