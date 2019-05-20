import * as React from 'react';
import styles from './StatusElement.module.scss';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { IStatusElementProps } from './IStatusElementProps';

const StatusElement = ({ iconName, label, value, comment, iconSize = 30 }: IStatusElementProps) => {
    return (
        <div className={styles.statusElement}>
            <div className={styles.container}>
                <div className={styles.statusIcon} style={{ fontSize: iconSize }}>
                    <Icon iconName={iconName} />
                </div>
                <div className={styles.statusContent}>
                    <div className={styles.statusElementLabel}>{label}</div>
                    <div className={styles.statusElementValue}>{value}</div>
                    <div className={styles.statusElementComment}>{comment}</div>
                </div>
            </div>
        </div>
    );
};

export default StatusElement;
