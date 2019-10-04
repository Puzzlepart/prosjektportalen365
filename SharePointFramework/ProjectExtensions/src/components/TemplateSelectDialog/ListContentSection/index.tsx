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
                contentClassName={styles.content}>
                {this.props.listContentConfig.map(l => (
                    <div id={l.key} key={l.key} className={styles.item}>
                        <Toggle
                            label={l.title}
                            defaultChecked={l.isDefault}
                            onChanged={checked => this._onChanged(l, checked)} />
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