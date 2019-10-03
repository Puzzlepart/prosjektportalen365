import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as strings from 'ProjectExtensionsStrings';
import * as React from 'react';
import { ListContentConfig } from '../../../models';
import { CollapsableSection } from '../../CollapsableSection';
import { IListContentSectionProps } from './IListContentSectionProps';
import styles from './ListContentSection.module.scss';

export class ListContentSection extends React.PureComponent<IListContentSectionProps> {
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
                            onChanged={checked => this._onChanged(lcc, checked)} />
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
    private _onChanged(listContentConfig: ListContentConfig, checked: boolean): void {
        let selectedListContentConfig = [];
        if (checked) {
            selectedListContentConfig = [listContentConfig, ...this.props.selectedListContentConfig];
        }
        else {
            selectedListContentConfig = this.props.selectedListContentConfig.filter(lcc => listContentConfig.title !== lcc.title);
        }
        this.props.onChange(selectedListContentConfig);
    }
}
