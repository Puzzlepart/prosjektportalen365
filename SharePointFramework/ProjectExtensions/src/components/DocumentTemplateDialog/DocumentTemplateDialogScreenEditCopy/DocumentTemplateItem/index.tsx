import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import styles from './DocumentTemplateItem.module.scss';
import { IDocumentTemplateItemProps } from './IDocumentTemplateItemProps';
import { IDocumentTemplateItemState } from './IDocumentTemplateItemState';

export class DocumentTemplateItem extends React.PureComponent<IDocumentTemplateItemProps, IDocumentTemplateItemState> {
    constructor(props: IDocumentTemplateItemProps) {
        super(props);
        this.state = { isExpanded: false };
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
                    <div className={styles.nameInput}>
                        <TextField
                            label={strings.NameLabel}
                            placeholder={strings.NameLabel}
                            defaultValue={this.props.model.name}
                            onChange={(_evt, newName) => this.props.onInputChanged(this.props.model.id, { newName })} />
                    </div>
                    <div className={styles.titleInput}>
                        <TextField
                            label={strings.TitleLabel}
                            placeholder={strings.TitleLabel}
                            onChange={(_evt, newTitle) => this.props.onInputChanged(this.props.model.id, { newTitle })} />
                    </div>
                </div>
            </div>
        );
    }

    /**
     * On expand collapse
     */
    private _onExpandCollapse(): void {
        this.setState(({ isExpanded }) => ({ isExpanded: !isExpanded }));
    }
}
