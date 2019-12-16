import * as React from 'react';
import styles from './MatrixCell.module.scss';
import { IMatrixCellProps } from './IMatrixCellProps';

// tslint:disable-next-line: naming-convention
export const MatrixCell = ({ style,  children }: IMatrixCellProps) => {
    return (
        <td className={styles.matrixCell} style={style} >
            <div className={styles.container}>
                {children}
            </div>
        </td>
    );
};


export interface IMatrixHeaderCellProps extends React.HTMLProps<HTMLElement> {
    label: string;
}

// tslint:disable-next-line: naming-convention
export const MatrixHeaderCell = (props: IMatrixHeaderCellProps) => {
    return (
        <td className={styles.matrixCell}>
            <span>{props.label}</span>
        </td>
    );
};

export enum MatrixCellType {
    Header,
    Cell,
}