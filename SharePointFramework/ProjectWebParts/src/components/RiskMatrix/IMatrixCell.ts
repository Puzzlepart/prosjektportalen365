import { MatrixCellType } from './MatrixCell';

export interface IMatrixCell {
    cellValue?: string;
    cellType: MatrixCellType;
    className: string;
    style?: React.CSSProperties;
    consequence?: number;
    probability?: number;
}