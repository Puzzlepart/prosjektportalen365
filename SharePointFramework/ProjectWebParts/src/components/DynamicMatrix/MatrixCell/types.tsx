import { CSSProperties, HTMLProps } from 'react'

/** Distinguishes uncertainty cells from matrix headers. */
export enum MatrixCellType {
  Header,
  Cell
}

/** Coordinates, appearance and content of a configured matrix cell. */
export interface IMatrixCell {
  cellType: MatrixCellType
  cellValue?: string
  className?: string
  style?: CSSProperties
  x?: number
  y?: number
  backgroundColor?: string
}

/** Supplies a configured cell to the matrix renderer. */
export interface IMatrixCellProps extends HTMLProps<HTMLDivElement> {
  cell?: IMatrixCell

  /**
   * The cell's zone as text (`getMatrixZones`): its name, read and shown on hover, and its mark,
   * shown in a corner, besides its colour.
   */
  zone?: { name: string; mark: string }
}
