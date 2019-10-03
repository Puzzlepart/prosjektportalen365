import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { BaseDialog } from '../@BaseDialog';
import { ExtensionsSection } from './ExtensionsSection';
import { ITemplateSelectDialogProps } from './ITemplateSelectDialogProps';
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState';
import { ListContentSection } from './ListContentSection';
import { TemplateSelector } from './TemplateSelector';
import { SettingsSection } from './SettingsSection';
import styles from './TemplateSelectDialog.module.scss';

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
            settings: {
                includeStandardFolders: false,
                copyPlannerTasks: true,
                localProjectPropertiesList: true,
            },
        };
    }

    public render(): React.ReactElement<ITemplateSelectDialogProps> {
        return (
            <BaseDialog
                version={this.props.version}
                dialogContentProps={{
                    title: strings.TemplateSelectDialogTitle,
                    subText: strings.TemplateSelectDialogInfoText,
                }}
                modalProps={{ isBlocking: true, isDarkOverlay: true }}
                onDismiss={this.props.onDismiss}
                onRenderFooter={this._onRenderFooter.bind(this)}
                containerClassName={styles.templateSelectDialog}>
                <TemplateSelector
                    templates={this.props.data.templates}
                    selectedTemplate={this.state.selectedTemplate}
                    onChange={selectedTemplate => this.setState({ selectedTemplate })} />
                <ExtensionsSection
                    extensions={this.props.data.extensions}
                    selectedExtensions={this.state.selectedExtensions}
                    onChange={selectedExtensions => this.setState({ selectedExtensions })} />
                <ListContentSection
                    listContentConfig={this.props.data.listContentConfig}
                    selectedListContentConfig={this.state.selectedListContentConfig}
                    onChange={selectedListContentConfig => this.setState({ selectedListContentConfig })} />
                <SettingsSection
                    defaultChecked={this.state.settings}
                    onChange={settings => this.setState({ settings })} />
            </BaseDialog>
        );
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

