import { FileAddResult, sp } from '@pnp/sp';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Selection } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as React from 'react';
import * as stringFormat from 'string-format';
import * as TemplateSelectorCommandSetStrings from 'TemplateSelectorCommandSetStrings';
import { TemplateFile } from '../../models';
import { IDocumentTemplateModalProps } from './IDocumentTemplateModalProps';
import { IDocumentTemplateModalState } from './IDocumentTemplateModalState';
import styles from './DocumentTemplateModal.module.scss';
import { DocumentTemplateModalScreen } from './DocumentTemplateModalScreen';
import DocumentTemplateModalScreenEditCopy from './DocumentTemplateModalScreenEditCopy';
import DocumentTemplateModalScreenSelect from './DocumentTemplateModalScreenSelect';

export default class DocumentTemplateModal extends React.Component<IDocumentTemplateModalProps, IDocumentTemplateModalState> {
    private selection: Selection;

    /**
     * Constructor
     * 
     * @param {IDocumentTemplateModalProps} props Props
     */
    constructor(props: IDocumentTemplateModalProps) {
        super(props);
        this.state = {
            isBlocking: false,
            selection: [],
            screen: DocumentTemplateModalScreen.Select,
        };
        this.selection = new Selection({ onSelectionChanged: () => { this.setState({ selection: this.selection.getSelection() as TemplateFile[] }); } });
    }

    public render(): React.ReactElement<IDocumentTemplateModalProps> {
        return (
            <Modal
                isOpen={true}
                isBlocking={this.state.isBlocking}
                isDarkOverlay={true}
                onDismiss={this.props.onDismiss}
                containerClassName={styles.documentTemplateModal}>
                <div className={styles.modalInner}>
                    <div className={styles.modalTitle}>
                        {this.props.title}
                    </div>
                    <div className={styles.modalBody}>
                        {this.renderScreen()}
                    </div>
                </div>
            </Modal>
        );
    }

    /**
     * Render body
     */
    private renderScreen() {
        const { screen, selection, templatesAdded, progress } = this.state;

        switch (screen) {
            case DocumentTemplateModalScreen.Select: {
                return (
                    <DocumentTemplateModalScreenSelect
                        templates={this.props.templates}
                        selection={this.selection}
                        selectedItems={selection}
                        onSubmitSelection={() => this.onChangeScreen(DocumentTemplateModalScreen.EditCopy)} />
                );
            }
            case DocumentTemplateModalScreen.EditCopy: {
                return (
                    <DocumentTemplateModalScreenEditCopy
                        selectedTemplates={selection}
                        libraries={this.props.libraries}
                        onStartCopy={this.onStartCopy.bind(this)}
                        onGoBack={() => this.onChangeScreen(DocumentTemplateModalScreen.Select)} />
                );
            }
            case DocumentTemplateModalScreen.CopyProgress: {
                return <ProgressIndicator label={TemplateSelectorCommandSetStrings.CopyProgressLabel} {...progress} />;
            }
            case DocumentTemplateModalScreen.Summary: {
                return (
                    <React.Fragment>
                        <MessageBar messageBarType={MessageBarType.success}>{stringFormat(TemplateSelectorCommandSetStrings.SummaryText, templatesAdded.length)}</MessageBar>
                        <div className={styles.actions}>
                            <DefaultButton text={TemplateSelectorCommandSetStrings.GetMoreText} onClick={_ => this.onChangeScreen(DocumentTemplateModalScreen.Select)} />
                            <DefaultButton text={TemplateSelectorCommandSetStrings.CloseModalText} onClick={this.props.onDismiss} />
                        </div>
                    </React.Fragment>
                );
            }
        }
    }

    /**
     * On change screen
     * 
     * @param {DocumentTemplateModalScreen} screen Screen
     */
    private onChangeScreen = (screen: DocumentTemplateModalScreen) => {
        this.setState({ screen });
    }

    /**
     * On start copy templates
     * 
     * @param {TemplateFile[]} templates Templates
     * @param {string} serverRelativeUrl Server relative url
     * 
     * @returns Promise<void>
     */
    private async onStartCopy(templates: TemplateFile[], serverRelativeUrl: string): Promise<void> {
        this.setState({ screen: DocumentTemplateModalScreen.CopyProgress, isBlocking: true });

        let templatesAdded: FileAddResult[] = [];
        const folder = sp.web.getFolderByServerRelativeUrl(serverRelativeUrl);

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            this.setState({ progress: { description: template.newName, percentComplete: (i / templates.length) } });
            try {
                templatesAdded.push(await template.copyTo(folder));
            } catch (error) { }
        }

        this.selection.setItems([], true);
        this.setState({ screen: DocumentTemplateModalScreen.Summary, templatesAdded, isBlocking: false, selection: [] });
    }
}
