import { IProgressIndicatorProps, ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as React from 'react';
import styles from './ProgressBar.module.scss';

// tslint:disable-next-line: naming-convention
export const ProgressBar = ({ label, description }: IProgressIndicatorProps) => {
    if (!label) return null;
    return (
        <div className={styles.progressBar}>
            <ProgressIndicator label={label} description={description} />
        </div>
    );
};