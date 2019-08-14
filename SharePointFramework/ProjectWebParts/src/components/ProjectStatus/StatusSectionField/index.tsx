import * as React from 'react';
import styles from './StatusSectionField.module.scss';
import { IStatusSectionFieldProps } from './IStatusSectionFieldProps';

const StatusSectionField = ({ label, value }: IStatusSectionFieldProps) => {
    return (
        <div className={styles.statusSectionField}>
            <div className={styles.statusSectionFieldInner}>
                <div className={styles.statusSectionFieldLabel}>{label}</div>
                <div className={styles.statusSectionFieldValue}>{value}</div>
            </div>
        </div>
    );
};

export default StatusSectionField;
