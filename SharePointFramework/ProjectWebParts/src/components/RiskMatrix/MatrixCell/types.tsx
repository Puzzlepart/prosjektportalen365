import { CSSProperties, HTMLProps } from 'react'

export enum MatrixCellType {
  Header,
  Cell
}

export interface IMatrixCell {
  cellValue?: string
  cellType: MatrixCellType
  className: string
  style?: CSSProperties
  consequence?: number
  probability?: number
}

export interface IMatrixCellProps extends HTMLProps<HTMLDivElement> {
  cell?: IMatrixCell
}