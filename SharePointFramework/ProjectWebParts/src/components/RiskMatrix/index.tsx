import * as React from 'react';
import { IRiskMatrixProps } from './IRiskMatrixProps';
import { MatrixRows } from './MatrixRow';
import styles from './RiskMatrix.module.scss';


export const RiskMatrix = ({ items = [], width = 400, height = 300, calloutTemplate }: IRiskMatrixProps) => {
    return (
        <div className={styles.riskMatrix} style={{ width, height }}>
            <table className={styles.table}>
                <tbody>
                    <MatrixRows items={items} calloutTemplate={calloutTemplate} />
                </tbody>
            </table>
        </div>
    );
};
export * from './IRiskMatrixProps';

