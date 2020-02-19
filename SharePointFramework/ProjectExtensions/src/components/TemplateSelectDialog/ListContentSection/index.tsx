import { Toggle } from 'office-ui-fabric-react/lib/Toggle';
import * as React from 'react';
import { ListContentConfig } from '../../../models';
import { IListContentSectionProps } from './IListContentSectionProps';
import styles from './ListContentSection.module.scss';

// tslint:disable-next-line: naming-convention
export const ListContentSection = (props: IListContentSectionProps) => {
    /**
     * On item toggle
     * 
     * @param {ListContentConfig} listContentConfig List content config
     * @param {boolean} checked Checked
     */
    const onChanged = (listContentConfig: ListContentConfig, checked: boolean): void => {
        let selectedListContentConfig = [];
        if (checked) {
            selectedListContentConfig = [listContentConfig, ...props.selectedListContentConfig];
        }
        else {
            selectedListContentConfig = props.selectedListContentConfig.filter(lcc => listContentConfig.title !== lcc.title);
        }
        props.onChange(selectedListContentConfig);
    };

    const selectedKeys = props.selectedListContentConfig.map(lc => lc.key);

    return (
        <div className={styles.listContentSection}>
            <div className={styles.container}>
                {props.listContentConfig.map(lcc => (
                    <div key={lcc.key} className={styles.item} hidden={lcc.hidden}>
                        <Toggle
                            label={lcc.title}
                            defaultChecked={selectedKeys.indexOf(lcc.key) !== -1}
                            inlineLabel={true}
                            onChanged={checked => onChanged(lcc, checked)} />
                    </div>
                ))}
            </div>
        </div>
    );
};