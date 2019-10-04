import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as React from 'react';
import { ListContentConfig } from '../../../models';
import { IListContentSectionProps } from './IListContentSectionProps';
import styles from './ListContentSection.module.scss';

export class ListContentSection extends React.PureComponent<IListContentSectionProps> {
    public render() {
        return (
            <div className={styles.listContentSection}>
                <div className={styles.container}>
                    {this.props.listContentConfig.map(l => (
                        <div id={l.key} key={l.key} className={styles.item}>
                            <Toggle
                                label={l.title}
                                defaultChecked={l.isDefault}
                                inlineLabel={true}
                                onChanged={checked => this._onChanged(l, checked)} />
                        </div>
                    ))}
                </div>
            </div>
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