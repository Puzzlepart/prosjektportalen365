import { FileAddResult } from '@pnp/sp';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Selection } from 'office-ui-fabric-react/lib/DetailsList';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import { ProgressIndicator } from 'office-ui-fabric-react/lib/ProgressIndicator';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import * as formatString from 'string-format';
import { SPDataAdapter } from '../../data';
import { TemplateFile } from '../../models/index';
import { BaseDialog } from '../@BaseDialog/index';
import { InfoMessage } from '../InfoMessage';
import styles from './DocumentTemplateDialog.module.scss';
import { DocumentTemplateDialogScreen } from './DocumentTemplateDialogScreen';
import { DocumentTemplateDialogScreenEditCopy } from './DocumentTemplateDialogScreenEditCopy';
import { DocumentTemplateDialogScreenSelect } from './DocumentTemplateDialogScreenSelect';
import { IDocumentTemplateDialogProps } from './IDocumentTemplateDialogProps';

// tslint:disable-next-line: naming-convention
export const DocumentTemplateDialog = (props: IDocumentTemplateDialogProps) => {
    const selection = new Selection({ onSelectionChanged });

    let [selected, setSelected] = React.useState([]);
    const [progress, setProgress] = React.useState(null);
    const [screen, setScreen] = React.useState(DocumentTemplateDialogScreen.Select);
    const [isBlocking, setIsBlocking] = React.useState(false);
    const [uploaded, setUploaded] = React.useState([]);


    function onRenderContent() {
        switch (screen) {
            case DocumentTemplateDialogScreen.Select: {
                return (
                    <DocumentTemplateDialogScreenSelect
                        templates={props.templates}
                        selection={selection}
                        selectedItems={selected}
                        templateLibrary={props.templateLibrary} />
                );
            }
            case DocumentTemplateDialogScreen.EditCopy: {
                return (
                    <DocumentTemplateDialogScreenEditCopy
                        selectedTemplates={selected}
                        libraries={props.libraries}
                        onStartCopy={onStartCopy}
                        onChangeScreen={s => setScreen(s)} />
                );
            }
            case DocumentTemplateDialogScreen.CopyProgress: {
                return <ProgressIndicator label={strings.CopyProgressLabel} {...progress} />;
            }
            case DocumentTemplateDialogScreen.Summary: {
                return <InfoMessage type={MessageBarType.success} text={formatString(strings.SummaryText, uploaded.length)} />;
            }
        }
    }

    function onRenderFooter() {
        switch (screen) {
            case DocumentTemplateDialogScreen.Select: {
                return (
                    <>
                        <PrimaryButton
                            text={strings.OnSubmitSelectionText}
                            onClick={() => setScreen(DocumentTemplateDialogScreen.EditCopy)}
                            disabled={selected.length === 0} />
                    </>
                );
            }
            case DocumentTemplateDialogScreen.Summary: {
                return (
                    <>
                        <DefaultButton text={strings.GetMoreText} onClick={_ => setScreen(DocumentTemplateDialogScreen.Select)} />
                        <DefaultButton text={strings.CloseModalText} onClick={onClose} />
                    </>
                );
            }
            default: {
                return null;
            }
        }
    }

    function onSelectionChanged() {
        setSelected(selection.getSelection() as TemplateFile[]);
    }

    /**
     * On copy documents to web
     * 
     * @param {TemplateFile[]} templates Templates
     * @param {string} folderServerRelativeUrl Folder URL
     */
    async function onStartCopy(templates: TemplateFile[], folderServerRelativeUrl: string): Promise<void> {
        setScreen(DocumentTemplateDialogScreen.CopyProgress);
        setIsBlocking(true);

        let folder = SPDataAdapter.sp.web.getFolderByServerRelativeUrl(folderServerRelativeUrl);
        let filesAdded: FileAddResult[] = [];

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i];
            setProgress({ description: template.newName, percentComplete: (i / templates.length) });
            try {
                filesAdded.push(await template.copyTo(folder));
            } catch (error) { }
        }

        selection.setItems([], true);
        setScreen(DocumentTemplateDialogScreen.Summary);
        setUploaded(filesAdded);
        setIsBlocking(false);
    }

    /**
     * On close dialog
     */
    function onClose() {
        props.onDismiss({ reload: screen === DocumentTemplateDialogScreen.Summary });
    }


    return (
        <BaseDialog
            dialogContentProps={{ title: props.title }}
            modalProps={{ isBlocking, isDarkOverlay: isBlocking }}
            onRenderFooter={onRenderFooter}
            onDismiss={onClose}
            containerClassName={styles.documentTemplateDialog}>
            {onRenderContent()}
        </BaseDialog>
    );
};

export * from './IDocumentTemplateDialogDismissProps';
export { IDocumentTemplateDialogProps };

