import * as React from 'react';
import styles from './StatusSectionField.module.scss';
import { IStatusSectionFieldProps } from './IStatusSectionFieldProps';

// tslint:disable-next-line: naming-convention
export const StatusSectionField = ({ label, value }: IStatusSectionFieldProps) => {
    return (
        <div className={styles.statusSectionField}>
            <div className={styles.statusSectionFieldInner}>
                <div className={styles.statusSectionFieldLabel}>{label}</div>
                <div className={styles.statusSectionFieldValue}>{value}</div>
            </div>
        </div>
    );
};