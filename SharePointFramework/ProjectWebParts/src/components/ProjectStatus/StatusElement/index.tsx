import { Icon } from 'office-ui-fabric-react/lib/Icon';
import * as React from 'react';
import { IStatusElementProps } from './IStatusElementProps';
import styles from './StatusElement.module.scss';

/**
 * @component StatusElement
 */

export const StatusElement = ({ iconName, label, value, comment, iconSize = 30, iconColor }: IStatusElementProps) => {
    return (
        <div className={styles.statusElement}>
            <div className={styles.container}>
                <div className={styles.statusIcon} style={{ fontSize: iconSize, color: iconColor }}>
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