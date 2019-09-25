import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ListContentConfig } from '../../../models/index';
import CollapsableSection from '../../CollapsableSection/index';
import { IListContentSectionProps } from './IListContentSectionProps';
import { IListContentSectionState } from './IListContentSectionState';
import styles from './ListContentSection.module.scss';

export class ListContentSection extends React.Component<IListContentSectionProps, IListContentSectionState> {
    /**
     * Constructor
     * 
     * @param {IListContentSectionProps} props Properties
     */
    constructor(props: IListContentSectionProps) {
        super(props);
        this.state = { selectedListConfig: this.props.listContentConfig.filter(lcc => lcc.isDefault) };
    }

    public render() {
        return (
            <CollapsableSection
                hidden={this.props.listContentConfig.length === 0}
                title={strings.ListContentTitle}
                className={styles.listContentSection}
                contentClassName={styles.list}>
                {this.props.listContentConfig.map((lcc, idx) => (
                    <div key={idx} className={styles.listItem}>
                        <Toggle
                            label={lcc.title}
                            defaultChecked={lcc.isDefault}
                            onChanged={checked => this._onItemToggle(lcc, checked)} />
                    </div>
                ))}
            </CollapsableSection>
        );
    }

    /**
     * On item toggle
     * 
     * @param {ListContentConfig} listContentConfig List content config
     * @param {boolean} checked Checked
     */
    private _onItemToggle(listContentConfig: ListContentConfig, checked: boolean): void {
        let selectedListConfig = [];
        if (checked) {
            selectedListConfig = [listContentConfig, ...this.state.selectedListConfig];
            this.setState({ selectedListConfig });
        }
        else {
            selectedListConfig = this.state.selectedListConfig.filter(lcc => listContentConfig.title !== lcc.title);
            this.setState({ selectedListConfig });
        }
        this.props.onChange({ selectedListConfig });
    }
}
