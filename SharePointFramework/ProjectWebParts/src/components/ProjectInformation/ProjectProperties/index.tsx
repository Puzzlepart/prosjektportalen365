import { DisplayMode } from '@microsoft/sp-core-library';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { IProjectPropertiesProps } from './IProjectPropertiesProps';
import styles from './ProjectProperties.module.scss';
import { ProjectProperty } from './ProjectProperty';

export class ProjectProperties extends React.PureComponent<IProjectPropertiesProps> {
    public render(): React.ReactElement<IProjectPropertiesProps> {
        switch (this.props.displayMode) {
            case DisplayMode.Read: {
                return (
                    <div className={styles.projectProperties}>
                        {this._nonEmptyProperties.map((model, idx) => <ProjectProperty key={idx} model={model} />)}
                    </div>
                );
            }
            case DisplayMode.Edit: {
                return (
                    <div className={styles.projectProperties}>
                        <Pivot>
                            <PivotItem headerText={this.props.title}>
                                <div className={styles.pivotItem}>
                                    {this._nonEmptyProperties.map((model, idx) => <ProjectProperty key={idx} model={model} />)}
                                </div>
                            </PivotItem>
                            <PivotItem headerText={strings.ExternalUsersConfigText} itemIcon='FilterSettings'>
                                <div className={styles.pivotItem}>
                                    {this._visibleProperties.map((model, idx) => (
                                        <ProjectProperty
                                            key={idx}
                                            model={model}
                                            displayMode={DisplayMode.Edit}
                                            onFieldExternalChanged={this.props.onFieldExternalChanged}
                                            showFieldExternal={this.props.showFieldExternal} />
                                    ))}
                                </div>
                            </PivotItem>
                        </Pivot>
                    </div>
                );
            }
        }
    }

    private get _visibleProperties() {
        return this.props.properties.filter(p => p.visible);
    }

    private get _nonEmptyProperties() {
        return this._visibleProperties.filter(p => !p.empty);
    }
}

export { IProjectPropertiesProps };

