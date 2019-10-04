import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ProjectSetupSettings } from '../../extensions/projectSetup/ProjectSetupSettings';
import { BaseDialog } from '../@BaseDialog';
import { ExtensionsSection } from './ExtensionsSection';
import { ITemplateSelectDialogProps } from './ITemplateSelectDialogProps';
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState';
import { ListContentSection } from './ListContentSection';
import { SettingsSection } from './SettingsSection';
import styles from './TemplateSelectDialog.module.scss';
import { TemplateSelector } from './TemplateSelector';

export class TemplateSelectDialog extends React.Component<ITemplateSelectDialogProps, ITemplateSelectDialogState> {
    /**
     * Constructor
     * 
     * @param {ITemplateSelectDialogProps} props Props
     */
    constructor(props: ITemplateSelectDialogProps) {
        super(props);
        this.state = {
            selectedTemplate: props.data.templates[0],
            selectedExtensions: [],
            selectedListContentConfig: props.data.listContentConfig.filter(lcc => lcc.isDefault),
            settings: new ProjectSetupSettings().useDefault(),
        };
    }

    public render(): React.ReactElement<ITemplateSelectDialogProps> {
        return (
            <BaseDialog
                version={this.props.version}
                dialogContentProps={{
                    title: strings.TemplateSelectDialogTitle,
                    subText: strings.TemplateSelectDialogInfoText,
                    className: styles.content,
                }}
                modalProps={{ isBlocking: true, isDarkOverlay: true }}
                onDismiss={this.props.onDismiss}
                onRenderFooter={this._onRenderFooter.bind(this)}
                containerClassName={styles.templateSelectDialog}>
                <Pivot>
                    <PivotItem headerText={strings.TemplateSelectorTitle} itemIcon='ViewListGroup'>
                        <TemplateSelector
                            templates={this.props.data.templates}
                            selectedTemplate={this.state.selectedTemplate}
                            onChange={selectedTemplate => this.setState({ selectedTemplate })} />
                    </PivotItem>
                    <PivotItem headerText={strings.ExtensionsTitle} itemIcon='ArrangeBringForward'>
                        <ExtensionsSection
                            extensions={this.props.data.extensions}
                            selectedExtensions={this.state.selectedExtensions}
                            onChange={selectedExtensions => this.setState({ selectedExtensions })} />
                    </PivotItem>
                    <PivotItem headerText={strings.ListContentTitle} itemIcon='ViewList'>
                        <ListContentSection
                            listContentConfig={this.props.data.listContentConfig}
                            selectedListContentConfig={this.state.selectedListContentConfig}
                            onChange={selectedListContentConfig => this.setState({ selectedListContentConfig })} />
                    </PivotItem>
                    <PivotItem headerText={strings.SettingsSectionTitle} itemIcon='ConfigurationSolid'>
                        <SettingsSection settings={this.state.settings} onChange={this._onSettingsChanged.bind(this)} />
                    </PivotItem>
                </Pivot>
            </BaseDialog>
        );
    }

    /**
     * On setting change
     * 
     * @param {string} key Key
     * @param {string} bool Bool
     */
    private _onSettingsChanged(key: string, bool: boolean) {
        this.setState({ settings: this.state.settings.set(key, bool) });
    }

    /**
     * On render footrer
     */
    private _onRenderFooter() {
        return (
            <>
                <DefaultButton
                    text={strings.CloseModalText}
                    onClick={this.props.onDismiss}
                    disabled={true} />
                <PrimaryButton
                    text={strings.TemplateSelectDialogSubmitButtonText}
                    iconProps={{ iconName: 'Settings' }}
                    onClick={this._onSubmit.bind(this)} />
            </>
        );
    }

    /**
     * On submit
     */
    private _onSubmit() {
        this.props.onSubmit(this.state);
    }
}

export { ITemplateSelectDialogProps, ITemplateSelectDialogState };

