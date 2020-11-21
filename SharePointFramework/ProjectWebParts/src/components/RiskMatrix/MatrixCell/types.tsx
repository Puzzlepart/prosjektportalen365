export enum MatrixCellType {
    Header,
    Cell
  }
  
export interface IMatrixCell {
    cellValue?: string
    cellType: MatrixCellType
    className: string
    style?: React.CSSProperties
    consequence?: number
    probability?: number
  }
  
export type IMatrixCellProps = React.HTMLProps<HTMLElement>
