import { DisplayMode } from '@microsoft/sp-core-library';
import { getId } from '@uifabric/utilities';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { IProjectPropertyProps } from './IProjectPropertyProps';
import styles from './ProjectProperty.module.scss';
import { ProjectPropertyModel } from './ProjectPropertyModel';

// tslint:disable-next-line: naming-convention
export const ProjectProperty = ({ model, style, displayMode = DisplayMode.Read, onFieldExternalChanged, showFieldExternal }: IProjectPropertyProps) => {
    switch (displayMode) {
        case DisplayMode.Edit: {
            return (
                <div
                    id={getId(model.internalName)}
                    className={styles.projectProperty}
                    title={model.description}
                    style={style}>
                    <div className={styles.label}>{model.displayName}</div>
                    <div className={styles.value}>
                        <Toggle
                            label={strings.ShowFieldExternalUsers}
                            inlineLabel={true}
                            defaultChecked={showFieldExternal ? showFieldExternal[model.internalName] : false}
                            onChange={(_event, checked) => onFieldExternalChanged(model.internalName, checked)} />
                    </div>
                </div>
            );
        }
        default: {
            return (
                <div
                    id={getId(model.internalName)}
                    className={styles.projectProperty}
                    title={model.description}
                    style={style}>
                    <div className={styles.label}>{model.displayName}</div>
                    <div className={styles.value}>{model.value}</div>
                </div>
            );
        }
    }
};

export { IProjectPropertyProps, ProjectPropertyModel };

