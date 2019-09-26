import * as React from 'react';
import styles from './ProjectProperty.module.scss';
import { IProjectPropertyProps } from './IProjectPropertyProps';
import { ProjectPropertyModel } from './ProjectPropertyModel';

// tslint:disable-next-line: naming-convention
export const ProjectProperty = ({ model, style }: IProjectPropertyProps) => {
    return (
        <div
            className={styles.projectProperty}
            data-type={model.type}
            data-required={model.required}
            title={model.description}
            style={style}>
            <div className={styles.projectPropertyLabel}>{model.displayName}</div>
            <div className={styles.projectPropertyValue}>{model.value}</div>
        </div>
    );
};

export { IProjectPropertyProps, ProjectPropertyModel };
