import React, { FC } from 'react';
import { IStatusSectionFieldProps } from './types';
import styles from './StatusSectionField.module.scss';


export const StatusSectionField: FC<IStatusSectionFieldProps> = (props) => {
  return (
    <div className={styles.root} style={{ width: props.width || 250 }}>
      <div className={styles.container}>
        <div className={styles.fieldLabel}>{props.label}</div>
        <div className={styles.fieldValue}>{props.value}</div>
      </div>
    </div>
  );
};

StatusSectionField.displayName = 'StatusSectionField';
StatusSectionField.defaultProps = {
  width: 250
}