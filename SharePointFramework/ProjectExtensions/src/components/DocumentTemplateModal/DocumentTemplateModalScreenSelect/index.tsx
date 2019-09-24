import * as React from 'react';
import styles from './DocumentTemplateModalScreenSelect.module.scss';
import * as ProjectExtensionsStrings from 'ProjectExtensionsStrings';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { DetailsList, SelectionMode, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { IDocumentTemplateModalScreenSelectProps } from './IDocumentTemplateModalScreenSelectProps';

export default class DocumentTemplateModalScreenSelect extends React.Component<IDocumentTemplateModalScreenSelectProps, {}> {
    private _columns: IColumn[] = [
        {
            key: 'name',
            fieldName: 'name',
            name: ProjectExtensionsStrings.NameLabel,
            minWidth: 200,
        },
        {
            key: 'title',
            fieldName: 'title',
            name: ProjectExtensionsStrings.TitleLabel,
            minWidth: 150,
        },
        {
            key: 'modified',
            fieldName: 'modified',
            name: ProjectExtensionsStrings.ModifiedLabel,
            minWidth: 150,
        }
    ];

    /**
     * Constructor
     * 
     * @param {IDocumentTemplateModalScreenSelectProps} props Props
     */
    constructor(props: IDocumentTemplateModalScreenSelectProps) {
        super(props);
    }

    public render(): React.ReactElement<IDocumentTemplateModalScreenSelectProps> {
        return (
            <div className={styles.documentTemplateModalScreenSelect}>
                <MarqueeSelection selection={this.props.selection}>
                    <DetailsList
                        items={this.props.templates}
                        columns={this._columns}
                        selection={this.props.selection}
                        selectionMode={SelectionMode.multiple} />
                </MarqueeSelection>
                <div className={styles.actions} hidden={this.props.selectedItems.length === 0}>
                    <PrimaryButton text={ProjectExtensionsStrings.OnSubmitSelectionText} onClick={this.props.onSubmitSelection} />
                </div>
            </div>
        );
    }
}
