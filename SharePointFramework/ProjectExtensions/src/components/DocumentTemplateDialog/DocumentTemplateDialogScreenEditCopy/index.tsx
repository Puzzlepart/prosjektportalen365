import { stringIsNullOrEmpty, TypedHash } from '@pnp/common';
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { InfoMessage } from '../../InfoMessage';
import { DocumentTemplateDialogScreen } from '../DocumentTemplateDialogScreen';
import styles from './DocumentTemplateDialogScreenEditCopy.module.scss';
import { DocumentTemplateItem } from './DocumentTemplateItem';
import { IDocumentTemplateDialogScreenEditCopyProps } from './IDocumentTemplateDialogScreenEditCopyProps';
import { ISPLibraryFolder } from 'data/SPDataAdapter/ISPLibraryFolder';

// tslint:disable-next-line: naming-convention
export const DocumentTemplateDialogScreenEditCopy = (props: IDocumentTemplateDialogScreenEditCopyProps) => {
    const [templates, setTemplates] = React.useState([...props.selectedTemplates]);
    const [selectedLibrary, setLibrary] = React.useState<ISPLibraryFolder>(props.libraries[0]);
    const [selectedFolder, setFolder] = React.useState<ISPLibraryFolder>(null);



    /**
     * On input changed
     * 
     * @param {string} id Id 
     * @param {Object} properties Updated properties
     * @param {string} errorMessage Error message
     */
    function onInputChanged(id: string, properties: TypedHash<string>, errorMessage?: string) {
        setTemplates(templates.map(t => {
            if (t.id === id) {
                t.update(properties);
                t.errorMessage = errorMessage;
            }
            return t;
        }));
    }

    function isFileNamesValid(): boolean {
        return templates.filter(t => !stringIsNullOrEmpty(t.errorMessage)).length === 0;
    }

    /**
     * On library changed
     * 
     * @param {any} _event Event
     * @param {IDropdownOption} option Option
     * @param {number} _index Index
     */
    function onLibraryChanged(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption, _index?: number) {
        setLibrary(option.data);
        setFolder(null);
    }

    /**
     * On folder changed
     * 
     * @param {any} _event Event
     * @param {IDropdownOption} option Option
     * @param {number} _index Index
     */
    function onFolderChanged(_event: React.FormEvent<HTMLDivElement>, option: IDropdownOption, _index?: number) {
        setFolder(option.data);
    }

    /**
     * On start copy
     */
    function onStartCopy() {
        let selectedFolderUrl = selectedFolder ? selectedFolder.ServerRelativeUrl : selectedLibrary.ServerRelativeUrl;
        props.onStartCopy(templates, selectedFolderUrl);
    }

    return (
        <div className={styles.documentTemplateDialogScreenEditCopy}>
            <InfoMessage text={strings.DocumentTemplateDialogScreenEditCopyInfoText} />
            {props.selectedTemplates.map(item => (
                <DocumentTemplateItem
                    model={item}
                    folderServerRelativeUrl={selectedFolder ? selectedFolder.ServerRelativeUrl : selectedLibrary.ServerRelativeUrl}
                    onInputChanged={onInputChanged} />)
            )}
            <div>
                <Dropdown
                    disabled={props.libraries.length === 1}
                    label={strings.DocumentLibraryDropdownLabel}
                    defaultSelectedKey={selectedLibrary.Id}
                    onChange={onLibraryChanged}
                    options={props.libraries.map(lib => ({ key: lib.Id, text: lib.Title, data: lib }))} />
            </div>
            <div>
                <Dropdown
                    disabled={selectedLibrary.Folders.length < 2}
                    label={strings.FolderDropdownLabel}
                    placeholder={selectedLibrary.Folders.length === 0 && `Det finnes ingen mapper i ${selectedLibrary.Title}.`}
                    defaultSelectedKey={selectedFolder && selectedFolder.Id}
                    options={selectedLibrary.Folders.map(fld => ({ key: fld.Id, text: fld.Title, data: fld }))}
                    onChange={onFolderChanged} />
            </div>
            <DialogFooter>
                <DefaultButton
                    text={strings.OnGoBackText}
                    iconProps={{ iconName: 'NavigateBack' }}
                    onClick={() => props.onChangeScreen(DocumentTemplateDialogScreen.Select)} />
                <PrimaryButton
                    text={strings.OnStartCopyText}
                    iconProps={{ iconName: 'Copy' }}
                    disabled={!isFileNamesValid()}
                    onClick={onStartCopy} />
            </DialogFooter>
        </div >
    );
};
