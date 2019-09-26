import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { InfoMessage } from '../../InfoMessage';
import styles from './DocumentTemplateDialogScreenEditCopy.module.scss';
import { DocumentTemplateItem } from './DocumentTemplateItem';
import { IDocumentTemplateDialogScreenEditCopyProps } from './IDocumentTemplateDialogScreenEditCopyProps';
import { IDocumentTemplateDialogScreenEditCopyState } from './IDocumentTemplateDialogScreenEditCopyState';

export class DocumentTemplateDialogScreenEditCopy extends React.Component<IDocumentTemplateDialogScreenEditCopyProps, IDocumentTemplateDialogScreenEditCopyState> {
    /**
     * Constructor
     * 
     * @param {IDocumentTemplateDialogScreenEditCopyProps} props Props
     */
    constructor(props: IDocumentTemplateDialogScreenEditCopyProps) {
        super(props);
        this.state = { templates: [...props.selectedTemplates], selectedLibrary: this.props.libraries[0], };
    }

    public render(): React.ReactElement<IDocumentTemplateDialogScreenEditCopyProps> {
        return (
            <div className={styles.documentTemplateDialogScreenEditCopy}>
                <InfoMessage text={strings.DocumentTemplateDialogScreenEditCopyInfoText} />
                {this.props.selectedTemplates.map(item => <DocumentTemplateItem model={item} onInputChanged={this._onInputChanged.bind(this)} />)}
                <div hidden={this.props.libraries.length === 1}>
                    <Dropdown
                        label={strings.DocumentLibraryDropdownLabel}
                        defaultSelectedKey={0}
                        onChange={this._onLibraryChanged.bind(this)}
                        options={this.props.libraries.map((lib, idx) => ({ key: idx, text: lib.Title, data: lib }))} />
                </div>
                <div className={styles.copyAction}>
                    <PrimaryButton text={strings.OnStartCopyText} onClick={this._onStartCopy.bind(this)} />
                </div>
            </div >
        );
    }

    /**
     * On input changed
     * 
     * @param {string} id Id 
     * @param {Object} updatedProperties Updated properties
     */
    private _onInputChanged(id: string, updatedProperties: { [key: string]: string }) {
        const { templates } = ({ ...this.state } as IDocumentTemplateDialogScreenEditCopyState);
        this.setState({
            templates: templates.map(t => {
                if (t.id === id) {
                    t.newName = updatedProperties.newName || t.newName;
                    t.newTitle = updatedProperties.newTitle || t.newTitle;
                }
                return t;
            })
        });
    }

    /**
     * On library changed
     * 
     * @param {any} _event Event
     * @param {IDropdownOption} option Option
     * @param {number} _index Index
     */
    private _onLibraryChanged(_event: React.FormEvent<HTMLDivElement>, { data: selectedLibrary }: IDropdownOption, _index?: number) {
        this.setState({ selectedLibrary });
    }

    /**
     * On start copy
     */
    private _onStartCopy() {
        this.props.onStartCopy(this.state.templates, this.state.selectedLibrary.ServerRelativeUrl);
    }
}
