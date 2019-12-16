import * as React from 'react';
import styles from './MatrixRow.module.scss';

export interface IMatrixRowProps extends React.HTMLProps<HTMLElement> { }

// tslint:disable-next-line: naming-convention
export const MatrixRow = ({ children }: IMatrixRowProps) => {
    return (
        <tr className={styles.matrixRow}>
            {children}
        </tr>
    );
};