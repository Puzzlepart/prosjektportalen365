import * as React from "react";
import { MessageBar } from "office-ui-fabric-react/lib/MessageBar";
import CheckListItem from "./CheckListItem";
import ISummaryViewProps from "./ISummaryViewProps";
import styles from './SummaryView.module.scss';

/**
 * Summary view
 */
export const SummaryView = ({ activePhase }: ISummaryViewProps) => {
    return (
        <div className={styles.summaryView}>
            <ul className={styles.checklist}>
                {activePhase.checklistData.items.map((item, idx) => (
                    <CheckListItem key={`SummaryView_CheckListItem_${idx}`} checkListItem={item} />
                ))}
            </ul>
        </div >
    );
};

export default SummaryView;
