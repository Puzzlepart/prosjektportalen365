import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dialog, DialogContent, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ProjectTemplate } from '../../models';
import { ExtensionsSection } from './ExtensionsSection';
import { ITemplateSelectModalProps } from './ITemplateSelectModalProps';
import { ITemplateSelectModalState } from './ITemplateSelectModalState';
import { ListContentSection } from './ListContentSection';
import { SettingsSection } from './SettingsSection';
import styles from './TemplateSelectModal.module.scss';

export default class TemplateSelectModal extends React.Component<ITemplateSelectModalProps, ITemplateSelectModalState> {
    /**
     * Constructor
     * 
     * @param props Props
     */
    constructor(props: ITemplateSelectModalProps) {
        super(props);
        this.state = {
            selectedTemplate: props.data.templates[0],
            selectedExtensions: [],
            selectedListConfig: props.data.listContentConfig.filter(lcc => lcc.isDefault),
            includeStandardFolders: false,
            copyPlannerTasks: true,
        };
    }

    public render(): React.ReactElement<ITemplateSelectModalProps> {
        return (
            <Dialog
                hidden={false}
                modalProps={{
                    isBlocking: true,
                    isDarkOverlay: true,
                }}
                dialogContentProps={{
                    title: strings.TemplateSelectModalTitle,
                    subText: strings.TemplateSelectModalInfoText,
                    type: DialogType.largeHeader,
                }}
                onDismiss={this.props.onDismiss}
                containerClassName={styles.templateSelectModal}>
                <span className={styles.versionString}>{this.props.versionString}</span>
                {this._body}
                {this._footer}
            </Dialog>
        );
    }

    /**
     * Render body
     */
    private get _body() {
        return (
            <DialogContent className={styles.content}>
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
                    defaultChecked={{ includeStandardFolders: this.state.includeStandardFolders, copyPlannerTasks: this.state.copyPlannerTasks }}
                    onChange={obj => this.setState(obj)} />
                <ExtensionsSection
                    extensions={this.props.data.extensions}
                    onChange={obj => this.setState(obj)} />
                <ListContentSection
                    listContentConfig={this.props.data.listContentConfig}
                    onChange={obj => this.setState(obj)} />
            </DialogContent>
        );
    }

    /**
     * Render footrer
     */
    private get _footer() {
        return (
            <DialogFooter>
                <div className={styles.submitButton}>
                    <DefaultButton
                        text={strings.TemplateSelectModalSubmitButtonText}
                        iconProps={{ iconName: 'Settings' }}
                        onClick={this._onSubmit.bind(this)} />
                </div>
            </DialogFooter>
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

export { ITemplateSelectModalProps, ITemplateSelectModalState };

