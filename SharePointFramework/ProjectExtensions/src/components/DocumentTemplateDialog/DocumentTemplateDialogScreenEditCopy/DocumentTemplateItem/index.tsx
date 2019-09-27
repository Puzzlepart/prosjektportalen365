import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import styles from './DocumentTemplateItem.module.scss';
import { IDocumentTemplateItemProps } from './IDocumentTemplateItemProps';
import { IDocumentTemplateItemState } from './IDocumentTemplateItemState';
import { getId } from '@uifabric/utilities';
import { SPDataAdapter } from 'data';

export class DocumentTemplateItem extends React.Component<IDocumentTemplateItemProps, IDocumentTemplateItemState> {
    private _nameId = getId('name');
    private _titleId = getId('title');
    private _changeTimeout: number;

    constructor(props: IDocumentTemplateItemProps) {
        super(props);
        this.state = { isExpanded: false };
    }

    public async componentDidMount() {
        let errorMessage = await SPDataAdapter.isFilenameValid(this.props.folderServerRelativeUrl, this.props.model.name);
        if (errorMessage) {
            this.props.onInputChanged(this.props.model.id, {}, errorMessage);
            this.setState({ isExpanded: true });
        }
    }

    public render(): React.ReactElement<IDocumentTemplateItemProps> {
        return (
            <div className={styles.documentTemplateItem}>
                <div className={styles.header} onClick={this._onExpandCollapse.bind(this)}>
                    <div className={styles.title}>{this.props.model.name}</div>
                    <div className={styles.icon}>
                        <Icon iconName={this.state.isExpanded ? 'ChevronDown' : 'ChevronUp'} />
                    </div>
                </div>
                <div hidden={!this.state.isExpanded}>
                    <div className={styles.inputField}>
                        <TextField
                            id={this._nameId}
                            label={strings.NameLabel}
                            placeholder={strings.NameLabel}
                            defaultValue={this.props.model.nameWithoutExtension}
                            suffix={`.${this.props.model.fileExtension}`}
                            errorMessage={this.props.model.errorMessage}
                            onChange={this._onInputChange.bind(this)} />
                    </div>
                    <div className={styles.inputField}>
                        <TextField
                            id={this._titleId}
                            label={strings.TitleLabel}
                            placeholder={strings.TitleLabel}
                            defaultValue={this.props.model.title}
                            onChange={this._onInputChange.bind(this)} />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * On input change
     * 
     * @param {React.FormEvent} event Event
     * @param {string} newValue New value
     * @param {number} resolveDelay Resolve delay
     */
    private _onInputChange(event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue: string, resolveDelay: number = 400) {
        clearTimeout(this._changeTimeout);
        this._changeTimeout = setTimeout(async () => {
            switch ((event.target as HTMLInputElement).id) {
                case this._nameId: {
                    let newName = `${newValue}.${this.props.model.fileExtension}`;
                    let errorMessage = await SPDataAdapter.isFilenameValid(this.props.folderServerRelativeUrl, newName);
                    this.props.onInputChanged(this.props.model.id, { newName }, errorMessage);
                }
                    break;
                case this._titleId: {
                    this.props.onInputChanged(this.props.model.id, { newTitle: newValue });
                }
                    break;
            }
        }, resolveDelay);
    }

    /**
     * On expand collapse
     */
    private _onExpandCollapse(): void {
        this.setState(({ isExpanded }) => ({ isExpanded: !isExpanded }));
    }
}
