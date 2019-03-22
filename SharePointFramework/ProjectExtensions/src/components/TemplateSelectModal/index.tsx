import * as React from 'react';
import styles from './TemplateSelectModal.module.scss';
import * as strings from 'ProjectSetupApplicationCustomizerStrings';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import { MessageBar } from 'office-ui-fabric-react/lib/MessageBar';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import CollapsableSection from '../CollapsableSection';
import { ITemplateSelectModalProps } from './ITemplateSelectModalProps';
import { ITemplateSelectModalState } from './ITemplateSelectModalState';
import { ProjectTemplate, ListContentConfig } from '../../models';

export default class TemplateSelectModal extends React.Component<ITemplateSelectModalProps, ITemplateSelectModalState> {
    constructor(props: ITemplateSelectModalProps) {
        super(props);
        this.state = {
            selectedTemplate: props.data.templates[0],
            selectedExtensions: [],
            selectedListConfig: props.data.listContentConfig.filter(lcc => lcc.isDefault),
            listContentHidden: true,
            extensionsHidden: true,
        };
    }

    public render(): React.ReactElement<ITemplateSelectModalProps> {
        return (
            <Modal
                isOpen={true}
                onDismiss={this.props.onDismiss}
                isBlocking={this.props.isBlocking}
                isDarkOverlay={this.props.isDarkOverlay}>
                <div className={styles.templateSelectModal}>
                    <div className={styles.templateSelectModalInner}>
                        <div className={styles.templateSelectModalBody}>
                            <div className={styles.modalTitle}>{strings.TemplateSelectModalTitle}</div>
                            <div className={styles.templateSelect}>
                                <div className={styles.templateSelectTitle}>{strings.TemplateSelectTitle}</div>
                                <div className={styles.templateSelectDropdown}>
                                    <Dropdown
                                        defaultSelectedKey='0'
                                        disabled={this.getTemplateOptions().length === 1}
                                        onChanged={this.onTemplateSelected}
                                        options={this.getTemplateOptions()} />
                                </div>
                            </div>
                            <CollapsableSection
                                hidden={this.props.data.listContentConfig.length === 0}
                                title={strings.ListContentTitle}
                                className={styles.listContent}
                                titleClassName={styles.listContentTitle}
                                contentClassName={styles.listContentList}>
                                {this.props.data.listContentConfig.map((lcc, idx) => (
                                    <div key={`${idx}`} className={styles.listContentItem}>
                                        <Toggle
                                            label={lcc.title}
                                            defaultChecked={lcc.isDefault}
                                            onChanged={checked => this.onListContentItemToggle(lcc, checked)} />
                                    </div>
                                ))}
                            </CollapsableSection>
                            <CollapsableSection
                                hidden={this.props.data.extensions.length === 0}
                                title={strings.ExtensionsTitle}
                                className={styles.extensions}
                                titleClassName={styles.extensionsTitle}
                                contentClassName={styles.extensionsList}>
                                {this.props.data.extensions.map((ext, idx) => (
                                    <div key={`${idx}`} className={styles.extensionItem}>
                                        <Toggle
                                            label={ext.title}
                                            defaultChecked={false}
                                            onChanged={checked => this.onExtensionItemToggle(ext, checked)} />
                                    </div>
                                ))}
                            </CollapsableSection>
                        </div>
                        <div className={styles.templateSelectModalFooter}>
                            <DefaultButton
                                className={styles.templateSelectModalSubmitButton}
                                text={strings.TemplateSelectModalSubmitButtonText}
                                onClick={this.onSubmit} />
                            <MessageBar>{strings.TemplateSelectModalFooterText}</MessageBar>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    }

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

    @autobind
    private onSubmit() {
        const { selectedExtensions, selectedListConfig, selectedTemplate } = this.state;
        this.props.onSubmit({ selectedExtensions, selectedListConfig, selectedTemplate });
    }

    @autobind
    private onTemplateSelected(opt: IDropdownOption) {
        this.setState({ selectedTemplate: (opt.data as ProjectTemplate) });
    }

    private getTemplateOptions(): IDropdownOption[] {
        return this.props.data.templates.map((template, idx) => {
            return { key: `${idx}`, text: template.title, data: template };
        });
    }
}
