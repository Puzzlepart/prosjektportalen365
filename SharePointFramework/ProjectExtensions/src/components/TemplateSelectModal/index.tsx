import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import * as React from 'react';
import { ListContentConfig, ProjectTemplate } from '../../models';
import CollapsableSection from '../CollapsableSection';
import ProjectSetupBaseModal from '../ProjectSetupBaseModal';
import { ITemplateSelectModalProps } from './ITemplateSelectModalProps';
import { ITemplateSelectModalState } from './ITemplateSelectModalState';
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
            <ProjectSetupBaseModal
                title={strings.TemplateSelectModalTitle}
                isBlocking={true}
                isDarkOverlay={true}
                containerClassName={styles.templateSelectModal}>
                {this.renderBody()}
                {this.renderFooter()}
            </ProjectSetupBaseModal>
        );
    }

    /**
     * Render body
     */
    private renderBody() {
        return (
            <React.Fragment>
                <div className={styles.templateSelect}>
                    <div className={styles.templateSelectTitle}>{strings.TemplateSelectTitle}</div>
                    <div className={styles.templateSelectDropdown}>
                        <Dropdown
                            defaultSelectedKey='0'
                            onChanged={this.onTemplateSelected}
                            options={this.getTemplateOptions()}
                            disabled={this.getTemplateOptions().length === 1} />
                    </div>
                </div>
                <CollapsableSection
                    title={strings.SettingsTitle}
                    className={styles.settings}
                    contentClassName={styles.settingsContent}>
                    <div className={styles.settingsItem}>
                        <Toggle
                            label={strings.IncludeStandardFoldersLabel}
                            defaultChecked={this.state.includeStandardFolders}
                            disabled={true}
                            onChanged={includeStandardFolders => this.setState({ includeStandardFolders })} />
                    </div>
                    <div className={styles.settingsItem}>
                        <Toggle
                            label={strings.CopyPlannerTasksLabel}
                            defaultChecked={this.state.copyPlannerTasks}
                            onChanged={copyPlannerTasks => this.setState({ copyPlannerTasks })} />
                    </div>
                </CollapsableSection>
                <CollapsableSection
                    title={strings.ListContentTitle}
                    className={styles.listContent}
                    contentClassName={styles.listContentList}>
                    {this.props.data.listContentConfig.map((lcc, idx) => (
                        <div key={`${idx}`} className={styles.listContentItem}>
                            <Toggle
                                label={lcc.title}
                                defaultChecked={lcc.isDefault}
                                disabled={true}
                                onChanged={checked => this.onListContentItemToggle(lcc, checked)} />
                        </div>
                    ))}
                </CollapsableSection>
                <CollapsableSection
                    hidden={this.props.data.extensions.length === 0}
                    title={strings.ExtensionsTitle}
                    className={styles.extensions}
                    contentClassName={styles.extensionsList}>
                    {this.props.data.extensions.map((ext, idx) => (
                        <div key={`${idx}`} className={styles.extensionItem}>
                            <Toggle label={ext.title} onChanged={checked => this.onExtensionItemToggle(ext, checked)} />
                        </div>
                    ))}
                </CollapsableSection>
            </React.Fragment>
        );
    }

    /**
     * Render footrer
     */
    private renderFooter() {
        return (
            <React.Fragment>
                <div className={styles.infoText}>
                    <MessageBar>{strings.TemplateSelectModalInfoText}</MessageBar>
                </div>
                <div className={styles.submitButton}>
                    <DefaultButton text={strings.TemplateSelectModalSubmitButtonText} onClick={this.onSubmit} />
                </div>
            </React.Fragment>
        );
    }

    /**
     * On extension item toggle
     * 
     * @param {ProjectTemplate} extension Extension
     * @param {boolean} checked Checked
     */
    private onExtensionItemToggle(extension: ProjectTemplate, checked: boolean): void {
        if (checked) {
            this.setState((prevState: ITemplateSelectModalState) => ({
                selectedExtensions: [extension, ...prevState.selectedExtensions],
            }));
        } else {
            this.setState((prevState: ITemplateSelectModalState) => ({
                selectedExtensions: prevState.selectedExtensions.filter(ext => extension.title !== ext.title),
            }));
        }
    }

    /**
     * On list content item toggle
     * 
     * @param {ListContentConfig} listContentConfig List content config
     * @param {boolean} checked Checked
     */
    private onListContentItemToggle(listContentConfig: ListContentConfig, checked: boolean): void {
        if (checked) {
            this.setState((prevState: ITemplateSelectModalState) => ({
                selectedListConfig: [listContentConfig, ...prevState.selectedListConfig],
            }));
        } else {
            this.setState((prevState: ITemplateSelectModalState) => ({
                selectedListConfig: prevState.selectedListConfig.filter(lcc => listContentConfig.title !== lcc.title),
            }));
        }
    }

    /**
     * On submit
     */
    private onSubmit = () => {
        this.props.onSubmit(this.state);
    }

    /**
     * On template selected
     * 
     * @param {IDropdownOption} opt Option
     */
    private onTemplateSelected = (opt: IDropdownOption) => {
        this.setState({ selectedTemplate: (opt.data as ProjectTemplate) });
    }

    /**
     * Get template options
     */
    private getTemplateOptions(): IDropdownOption[] {
        return this.props.data.templates.map((template, idx) => {
            return { key: `${idx}`, text: template.title, data: template };
        });
    }
}

export { ITemplateSelectModalProps, ITemplateSelectModalState };
