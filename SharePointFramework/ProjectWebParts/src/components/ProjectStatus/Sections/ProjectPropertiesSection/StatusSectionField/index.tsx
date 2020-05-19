import * as React from 'react';
import { IStatusSectionFieldProps } from './IStatusSectionFieldProps';
import styles from './StatusSectionField.module.scss';


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