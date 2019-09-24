import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import { Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib/Dropdown';
import * as React from 'react';
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings';
import { IDocumentTemplateModalScreenEditCopyProps } from './IDocumentTemplateModalScreenEditCopyProps';
import { IDocumentTemplateModalScreenEditCopyState } from './IDocumentTemplateModalScreenEditCopyState';
import styles from './DocumentTemplateModalScreenEditCopy.module.scss';

export default class DocumentTemplateModalScreenEditCopy extends React.Component<IDocumentTemplateModalScreenEditCopyProps, IDocumentTemplateModalScreenEditCopyState> {
    /**
     * Constructor
     * 
     * @param {IDocumentTemplateModalScreenEditCopyProps} props Props
     */
    constructor(props: IDocumentTemplateModalScreenEditCopyProps) {
        super(props);
        this.state = {
            templates: [...props.selectedTemplates],
            selectedLibrary: this.props.libraries[0],
            expandState: {},
        };
    }

    public render(): React.ReactElement<IDocumentTemplateModalScreenEditCopyProps> {
        const { expandState } = this.state;
        return (
            <div className={styles.documentTemplateModalScreenEditCopy}>
                {this.props.selectedTemplates.map(tmpl => (
                    <div className={styles.item}>
                        <div className={styles.header} onClick={_ => this._onExpandCollapse(tmpl.id)}>
                            <div className={styles.title}>{tmpl.name}</div>
                            <div className={styles.icon}>
                                <Icon iconName={expandState[tmpl.id] ? 'ChevronDown' : 'ChevronUp'} />
                            </div>
                        </div>
                        <div hidden={!expandState[tmpl.id]}>
                            <div className={styles.nameInput}>
                                <TextField
                                    label={ProjectExtensionsStrings.NameLabel}
                                    placeholder={ProjectExtensionsStrings.NameLabel}
                                    defaultValue={tmpl.newName}
                                    onChange={(_event, newName) => this._onInputChanged(tmpl.id, { newName })} />
                            </div>
                            <div className={styles.titleInput}>
                                <TextField
                                    label={ProjectExtensionsStrings.TitleLabel}
                                    placeholder={ProjectExtensionsStrings.TitleLabel}
                                    defaultValue={tmpl.newTitle}
                                    onChange={(_event, newTitle) => this._onInputChanged(tmpl.id, { newTitle })} />
                            </div>
                        </div>
                    </div>
                ))}
                <div>
                    <Dropdown
                        label={ProjectExtensionsStrings.LibraryDropdownLabel}
                        defaultSelectedKey={0}
                        onChange={this._onLibraryChanged.bind(this)}
                        disabled={this.props.libraries.length === 1}
                        options={this.props.libraries.map((lib, idx) => ({ key: idx, text: lib.Title, data: lib }))} />
                </div>
                <div className={styles.actions}>
                    <PrimaryButton text={ProjectExtensionsStrings.OnStartCopyText} onClick={this._onStartCopy.bind(this)} />
                    <DefaultButton text={ProjectExtensionsStrings.OnGoBackText} onClick={this.props.onGoBack} />
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
        const { templates } = ({ ...this.state } as IDocumentTemplateModalScreenEditCopyState);
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
     * On library chantged
     * 
     * @param _event Event
     * @param option Option
     * @param _index Index
     */
    private _onLibraryChanged(_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, _index?: number) {
        this.setState({ selectedLibrary: option.data });
    }

    /**
     * On expand collapse
     * 
     * @param {string} key Key
     */
    private _onExpandCollapse(key: string): void {
        this.setState(({ expandState }) => ({ expandState: { ...expandState, [key]: !expandState[key] } }));
    }

    /**
     * On start copy
     */
    private _onStartCopy() {
        this.props.onStartCopy(this.state.templates, this.state.selectedLibrary.ServerRelativeUrl);
        this.setState({ expandState: {}, templates: [] });
    }
}
