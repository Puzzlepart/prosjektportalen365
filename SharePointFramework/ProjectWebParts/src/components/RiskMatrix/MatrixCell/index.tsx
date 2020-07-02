import * as React from 'react'
import { IMatrixCellProps } from './IMatrixCellProps'
import styles from './MatrixCell.module.scss'


export const MatrixCell = ({ style,  children }: IMatrixCellProps) => {
    return (
        <td className={styles.matrixCell} style={style} >
            <div className={styles.container}>
                {children}
            </div>
        </td>
    )
}


export interface IMatrixHeaderCellProps extends React.HTMLProps<HTMLElement> {
    label: string;
}


export const MatrixHeaderCell = (props: IMatrixHeaderCellProps) => {
    return (
        <td className={`${styles.matrixCell} ${styles.headerCell}`}>
            <span>{props.label}</span>
        </td>
    )
}

export enum MatrixCellType {
    Header,
    Cell,
}