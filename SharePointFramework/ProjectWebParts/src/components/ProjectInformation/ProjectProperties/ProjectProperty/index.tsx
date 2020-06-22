import { DisplayMode } from '@microsoft/sp-core-library';
import { getId } from '@uifabric/utilities';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { IProjectPropertyProps } from './IProjectPropertyProps';
import styles from './ProjectProperty.module.scss';
import { ProjectPropertyModel } from './ProjectPropertyModel';


export const ProjectProperty = ({ model, style, displayMode = DisplayMode.Read, onFieldExternalChanged, showFieldExternal }: IProjectPropertyProps) => {
    let id = getId(`projectproperty_${model.internalName}`.toLowerCase());

    switch (displayMode) {
        case DisplayMode.Edit: {
            let defaultChecked = showFieldExternal ? showFieldExternal[model.internalName] : false;
            return (
                <div
                    id={id}
                    className={styles.projectProperty}
                    title={model.description}
                    style={style}>
                    <div className={styles.label}>{model.displayName}</div>
                    <div className={styles.value}>
                        <Toggle
                            label={strings.ShowFieldExternalUsers}
                            inlineLabel={true}
                            defaultChecked={defaultChecked}
                            onChange={(_event, checked) => onFieldExternalChanged(model.internalName, checked)} />
                    </div>
                </div>
            );
        }
        default: {
            return (
                <div
                    id={id}
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

