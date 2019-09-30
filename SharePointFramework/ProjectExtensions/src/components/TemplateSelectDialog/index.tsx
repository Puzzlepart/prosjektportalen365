import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { DialogContent, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ProjectTemplate } from '../../models/index';
import { BaseDialog } from '../@BaseDialog';
import { ExtensionsSection } from './ExtensionsSection';
import { ITemplateSelectDialogProps } from './ITemplateSelectDialogProps';
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState';
import { ListContentSection } from './ListContentSection';
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
            selectedListConfig: props.data.listContentConfig.filter(lcc => lcc.isDefault),
            includeStandardFolders: false,
            copyPlannerTasks: true,
            localProjectPropertiesList: true,
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
                <div className={styles.templateSelect}>
                    <div className={styles.templateSelectTitle}>{strings.TemplateSelectTitle}</div>
                    <div className={styles.templateSelectDropdown}>
                        <Dropdown
                            defaultSelectedKey='0'
                            onChanged={this._onTemplateSelected}
                            options={this._getTemplateOptions()}
                            disabled={this._getTemplateOptions().length === 1} />
                    </div>
                </div>
                <SettingsSection
                    defaultChecked={{
                        includeStandardFolders: this.state.includeStandardFolders,
                        copyPlannerTasks: this.state.copyPlannerTasks,
                        localProjectPropertiesList: this.state.localProjectPropertiesList,
                    }}
                    onChange={obj => this.setState(obj)} />
                <ExtensionsSection
                    extensions={this.props.data.extensions}
                    onChange={obj => this.setState(obj)} />
                <ListContentSection
                    listContentConfig={this.props.data.listContentConfig}
                    onChange={obj => this.setState(obj)} />
            </BaseDialog>
        );
    }

    /**
     * On render footrer
     */
    private _onRenderFooter() {
        return (
            <div className={styles.submitButton}>
                <DefaultButton
                    text={strings.TemplateSelectDialogSubmitButtonText}
                    iconProps={{ iconName: 'Settings' }}
                    onClick={this._onSubmit.bind(this)} />
            </div>
        );
    }

    /**
     * On submit
     */
    private _onSubmit() {
        this.props.onSubmit(this.state);
    }

    /**
     * On template selected
     * 
     * @param {IDropdownOption} opt Option
     */
    private _onTemplateSelected = (opt: IDropdownOption) => {
        this.setState({ selectedTemplate: (opt.data as ProjectTemplate) });
    }

    /**
     * Get template options
     */
    private _getTemplateOptions(): IDropdownOption[] {
        return this.props.data.templates.map((template, idx) => {
            return { key: `${idx}`, text: template.title, data: template };
        });
    }
}

export { ITemplateSelectDialogProps, ITemplateSelectDialogState };

