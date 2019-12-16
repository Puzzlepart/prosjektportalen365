import * as React from 'react';
import { IRiskMatrixProps } from './IRiskMatrixProps';
import styles from './RiskMatrix.module.scss';

// tslint:disable-next-line: naming-convention
export const RiskMatrix = ({ }: IRiskMatrixProps) => {
    return (
        <div className={styles.riskMatrix}>

        </div>
    );
};
export * from './IRiskMatrixProps';

