import * as React from 'react';
import styles from './TemplateLibrarySelectModalScreenSelect.module.scss';
import * as TemplateSelectorCommandSetStrings from 'TemplateSelectorCommandSetStrings';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { MarqueeSelection } from 'office-ui-fabric-react/lib/MarqueeSelection';
import { DetailsList, SelectionMode, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ITemplateLibrarySelectModalScreenSelectProps } from './ITemplateLibrarySelectModalScreenSelectProps';

export default class TemplateLibrarySelectModalScreenSelect extends React.Component<ITemplateLibrarySelectModalScreenSelectProps, {}> {
    private _columns: IColumn[] = [
        {
            key: 'name',
            fieldName: 'name',
            name: TemplateSelectorCommandSetStrings.NameLabel,
            minWidth: 200,
        },
        {
            key: 'title',
            fieldName: 'title',
            name: TemplateSelectorCommandSetStrings.TitleLabel,
            minWidth: 150,
        },
        {
            key: 'modified',
            fieldName: 'modified',
            name: TemplateSelectorCommandSetStrings.ModifiedLabel,
            minWidth: 150,
        }
    ];

    /**
     * Constructor
     * 
     * @param {ITemplateLibrarySelectModalScreenSelectProps} props Props
     */
    constructor(props: ITemplateLibrarySelectModalScreenSelectProps) {
        super(props);
    }

    public render(): React.ReactElement<ITemplateLibrarySelectModalScreenSelectProps> {
        return (
            <div className={styles.templateLibrarySelectModalScreenSelect}>
                <MarqueeSelection selection={this.props.selection}>
                    <DetailsList
                        items={this.props.templates}
                        columns={this._columns}
                        selection={this.props.selection}
                        selectionMode={SelectionMode.multiple} />
                </MarqueeSelection>
                <div className={styles.actions} hidden={this.props.selectedItems.length === 0}>
                    <PrimaryButton text={TemplateSelectorCommandSetStrings.OnSubmitSelectionText} onClick={this.props.onSubmitSelection} />
                </div>
            </div>
        );
    }
}
