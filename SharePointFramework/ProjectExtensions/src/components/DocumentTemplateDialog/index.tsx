import { FileAddResult, sp } from '@pnp/sp';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Selection } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as stringFormat from 'string-format';
import { TemplateFile } from '../../models/index';
import { BaseDialog } from '../@BaseDialog/index';
import { DocumentTemplateDialogScreen } from './DocumentTemplateDialogScreen';
import { DocumentTemplateDialogScreenEditCopy } from './DocumentTemplateDialogScreenEditCopy';
import { DocumentTemplateDialogScreenSelect } from './DocumentTemplateDialogScreenSelect';
import { IDocumentTemplateDialogProps } from './IDocumentTemplateDialogProps';
import { IDocumentTemplateDialogState } from './IDocumentTemplateDialogState';

export class DocumentTemplateDialog extends React.Component<IDocumentTemplateDialogProps, IDocumentTemplateDialogState> {
    private _selection: Selection;

    /**
     * Constructor
     * 
     * @param {IDocumentTemplateDialogProps} props Props
     */
    constructor(props: IDocumentTemplateDialogProps) {
        super(props);
        this.state = {
            isBlocking: false,
            selection: [],
            screen: DocumentTemplateDialogScreen.Select,
        };
        this._selection = new Selection({ onSelectionChanged: this._onSelectionChanged.bind(this) });
    }

    public render(): React.ReactElement<IDocumentTemplateDialogProps> {
        return (
            <BaseDialog
                dialogContentProps={{ title: this.props.title }}
                modalProps={{ isBlocking: false, isDarkOverlay: true }}
                onRenderFooter={this._onRenderFooter.bind(this)}
                onDismiss={this.props.onDismiss}>
                {this._content}
            </BaseDialog>
        );
    }

    private get _content() {
        switch (this.state.screen) {
            case DocumentTemplateDialogScreen.Select: {
                return (
                    <DocumentTemplateDialogScreenSelect
                        templates={this.props.templates}
                        selection={this._selection}
                        selectedItems={this.state.selection} />
                );
            }
            case DocumentTemplateDialogScreen.EditCopy: {
                return <DocumentTemplateDialogScreenEditCopy
                    selectedTemplates={this.state.selection}
                    libraries={this.props.libraries}
                    onStartCopy={this._onStartCopy.bind(this)} />;
            }
            case DocumentTemplateDialogScreen.CopyProgress: {
                return <ProgressIndicator label={ProjectExtensionsStrings.CopyProgressLabel} {...this.state.progress} />;
            }
            case DocumentTemplateDialogScreen.Summary: {
                return <MessageBar messageBarType={MessageBarType.success}>{stringFormat(ProjectExtensionsStrings.SummaryText, this.state.templatesAdded.length)}</MessageBar>;
            }
        }
    }

    private _onRenderFooter() {
        switch (this.state.screen) {
            case DocumentTemplateDialogScreen.Select: {
                return (
                    <>
                        <PrimaryButton text={ProjectExtensionsStrings.OnSubmitSelectionText} onClick={() => this._onChangeScreen(DocumentTemplateDialogScreen.EditCopy)} disabled={this.state.selection.length === 0} />
                    </>
                );
            }
            case DocumentTemplateDialogScreen.EditCopy: {
                return (
                    <>
                        <DefaultButton text={ProjectExtensionsStrings.OnGoBackText} onClick={() => this._onChangeScreen(DocumentTemplateDialogScreen.Select)} />
                    </>
                );
            }
            case DocumentTemplateDialogScreen.Summary: {
                return (
                    <>
                        <DefaultButton text={ProjectExtensionsStrings.GetMoreText} onClick={_ => this._onChangeScreen(DocumentTemplateDialogScreen.Select)} />
                        <DefaultButton text={ProjectExtensionsStrings.CloseModalText} onClick={this.props.onDismiss} />
                    </>
                );
            }
        }
    }

    private _onSelectionChanged() {
        this.setState({ selection: this._selection.getSelection() as TemplateFile[] });
    }

    /**
     * On change screen
     * 
     * @param {DocumentTemplateDialogScreen} screen Screen
     */
    private _onChangeScreen(screen: DocumentTemplateDialogScreen) {
        this.setState({ screen });
    }

    /**
     * On start copy templates
     * 
     * @param {TemplateFile[]} templates Templates
     * @param {string} serverRelativeUrl Server relative url
     */
    private async _onStartCopy(templates: TemplateFile[], serverRelativeUrl: string): Promise<void> {
        this.setState({ screen: DocumentTemplateDialogScreen.CopyProgress, isBlocking: true });

        let templatesAdded: FileAddResult[] = [];
        const folder = sp.web.getFolderByServerRelativeUrl(serverRelativeUrl);

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            this.setState({ progress: { description: template.newName, percentComplete: (i / templates.length) } });
            try {
                templatesAdded.push(await template.copyTo(folder));
            } catch (error) { }
        }

        this._selection.setItems([], true);
        this.setState({ screen: DocumentTemplateDialogScreen.Summary, templatesAdded, isBlocking: false, selection: [] });
    }
}

export { IDocumentTemplateDialogProps };