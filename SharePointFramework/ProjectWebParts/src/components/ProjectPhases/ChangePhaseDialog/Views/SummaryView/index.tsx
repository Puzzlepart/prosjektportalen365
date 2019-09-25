import * as React from 'react';
import CheckListItem from './CheckListItem';
import ISummaryViewProps from './ISummaryViewProps';
import styles from './SummaryView.module.scss';

/**
 * @component SummaryView
 */
// tslint:disable-next-line: naming-convention
export const SummaryView = ({ checklistItems }: ISummaryViewProps) => {
    return (
        <div className={styles.summaryView}>
            <ul className={styles.checklist}>
                {checklistItems.map(item => (
                    <CheckListItem key={item.ID} item={item} />
                ))}
            </ul>
        </div >
    );
};

export default SummaryView;
