import { sp, FileAddResult } from '@pnp/sp';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Selection } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import { autobind } from 'office-ui-fabric-react/lib/Utilities';
import * as React from 'react';
import * as stringFormat from 'string-format';
import * as TemplateSelectorCommandSetStrings from 'TemplateSelectorCommandSetStrings';
import { TemplateFile } from '../../models';
import { ITemplateLibrarySelectModalProps } from './ITemplateLibrarySelectModalProps';
import { ITemplateLibrarySelectModalState } from './ITemplateLibrarySelectModalState';
import styles from './TemplateLibrarySelectModal.module.scss';
import { TemplateLibrarySelectModalScreen } from './TemplateLibrarySelectModalScreen';
import TemplateLibrarySelectModalScreenEditCopy from './TemplateLibrarySelectModalScreenEditCopy';
import TemplateLibrarySelectModalScreenSelect from './TemplateLibrarySelectModalScreenSelect';

export default class TemplateLibrarySelectModal extends React.Component<ITemplateLibrarySelectModalProps, ITemplateLibrarySelectModalState> {
    private _selection: Selection;

    /**
     * Constructor
     * 
     * @param {ITemplateLibrarySelectModalProps} props Props
     */
    constructor(props: ITemplateLibrarySelectModalProps) {
        super(props);
        this.state = {
            isBlocking: false,
            selection: [],
            screen: TemplateLibrarySelectModalScreen.Select,
        };
        this._selection = new Selection({ onSelectionChanged: () => { this.setState({ selection: this._selection.getSelection() as TemplateFile[] }); } });
    }

    public render(): React.ReactElement<ITemplateLibrarySelectModalProps> {
        return (
            <Modal
                isOpen={true}
                isBlocking={this.state.isBlocking}
                isDarkOverlay={true}
                onDismiss={this.props.onDismiss}
                containerClassName={styles.templateLibrarySelectModal}>
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
            case TemplateLibrarySelectModalScreen.Select: {
                return (
                    <TemplateLibrarySelectModalScreenSelect
                        templates={this.props.templates}
                        selection={this._selection}
                        selectedItems={selection}
                        onSubmitSelection={() => this.onChangeScreen(TemplateLibrarySelectModalScreen.EditCopy)} />
                );
            }
            case TemplateLibrarySelectModalScreen.EditCopy: {
                return (
                    <TemplateLibrarySelectModalScreenEditCopy
                        selectedTemplates={selection}
                        onStartCopy={this.onStartCopy}
                        onGoBack={() => this.onChangeScreen(TemplateLibrarySelectModalScreen.Select)} />
                );
            }
            case TemplateLibrarySelectModalScreen.CopyProgress: {
                return <ProgressIndicator label={TemplateSelectorCommandSetStrings.CopyProgressLabel} {...progress} />;
            }
            case TemplateLibrarySelectModalScreen.Summary: {
                return (
                    <React.Fragment>
                        <MessageBar messageBarType={MessageBarType.success}>{stringFormat(TemplateSelectorCommandSetStrings.SummaryText, templatesAdded.length)}</MessageBar>
                        <div className={styles.actions}>
                            <DefaultButton text={TemplateSelectorCommandSetStrings.GetMoreText} onClick={_ => this.onChangeScreen(TemplateLibrarySelectModalScreen.Select)} />
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
     * @param {TemplateLibrarySelectModalScreen} screen Screen
     */
    @autobind
    private onChangeScreen(screen: TemplateLibrarySelectModalScreen) {
        this.setState({ screen });
    }

    /**
     * On start copy templates
     * 
     * @param templates Templates
     * @returns Promise<void>
     */
    @autobind
    private async onStartCopy(templates: TemplateFile[]): Promise<void> {
        this.setState({ screen: TemplateLibrarySelectModalScreen.CopyProgress, isBlocking: true });

        let templatesAdded: FileAddResult[] = [];
        const folder = sp.web.getFolderByServerRelativeUrl(this.props.libraryServerRelativeUrl);

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            this.setState({ progress: { description: template.newName, percentComplete: (i / templates.length) } });
            try {
                templatesAdded.push(await template.copyTo(folder));
            } catch (error) { }
        }

        this._selection.setItems([], true);
        this.setState({ screen: TemplateLibrarySelectModalScreen.Summary, templatesAdded, isBlocking: false, selection: [] });
    }
}
