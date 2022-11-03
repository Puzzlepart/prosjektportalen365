import { IMatrixCell } from '../MatrixCell'
import { IRiskMatrixProps } from '../types'

export type IMatrixRowProps = React.HTMLProps<HTMLElement>

export interface IMatrixRowsProps extends Pick<IRiskMatrixProps, 'items' | 'calloutTemplate'> {
  cells: IMatrixCell[][]
}
