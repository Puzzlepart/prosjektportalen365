import { DisplayMode } from '@microsoft/sp-core-library';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { UserMessage } from '../../UserMessage';
import { IProjectPropertiesProps } from './IProjectPropertiesProps';
import styles from './ProjectProperties.module.scss';
import { ProjectProperty } from './ProjectProperty';

export class ProjectProperties extends React.PureComponent<IProjectPropertiesProps> {
    public render(): React.ReactElement<IProjectPropertiesProps> {
        switch (this.props.displayMode) {
            case DisplayMode.Read: {
                return this._renderReadMode();
            }
            case DisplayMode.Edit: {
                return this._renderEditMode();
            }
        }
    }

    /**
     * Render content for DisplayMode.Read
     */
    private _renderReadMode() {
        if (this._nonEmptyProperties.length === 0) {
            return <MessageBar>{strings.NoPropertiesMessage}</MessageBar>;
        }
        return (
            <div className={styles.projectProperties}>
                {this._nonEmptyProperties.map((model, idx) => <ProjectProperty key={idx} model={model} />)}
            </div>
        );
    }

    /**
     * Render content for DisplayMode.Edit
     */
    private _renderEditMode() {
        return (
            <div className={styles.projectProperties}>
                <Pivot>
                    <PivotItem headerText={this.props.title}>
                        <div className={styles.pivotItem}>
                            {this._nonEmptyProperties.map((model, idx) => <ProjectProperty key={idx} model={model} />)}
                        </div>
                    </PivotItem>
                    {this.props.isSiteAdmin && (
                        <PivotItem headerText={strings.ExternalUsersConfigText} itemIcon='FilterSettings'>
                            <div className={styles.pivotItem}>
                                <UserMessage
                                    className={styles.pivotItemUserMessage}
                                    text={strings.ExternalUsersConfigInfoText} />
                                <UserMessage
                                    hidden={this.props.localList}
                                    className={styles.pivotItemUserMessage}
                                    text={strings.NoLocalPropertiesListWarningText}
                                    messageBarType={MessageBarType.warning} />
                                <div hidden={!this.props.localList}>
                                    {this._visibleProperties.map((model, idx) => (
                                        <ProjectProperty
                                            key={idx}
                                            model={model}
                                            displayMode={DisplayMode.Edit}
                                            onFieldExternalChanged={this.props.onFieldExternalChanged}
                                            showFieldExternal={this.props.showFieldExternal} />
                                    ))}
                                </div>
                            </div>
                        </PivotItem>
                    )}
                </Pivot>
            </div>
        );
    }

    private get _visibleProperties() {
        return this.props.properties.filter(p => p.visible);
    }

    private get _nonEmptyProperties() {
        return this._visibleProperties.filter(p => !p.empty);
    }
}

export { IProjectPropertiesProps };

