import * as React from 'react';
import { View, InitialView, SummaryView, ChangingPhaseView } from '../Views';
import IBodyProps from './IBodyProps';

// tslint:disable-next-line: naming-convention
export const Body = (props: IBodyProps) => {
    switch (props.currentView) {
        case View.Initial: {
            const currentChecklistItem = props.checklistItems[props.currentIdx];
            return (
                <InitialView
                    isLoading={props.isLoading}
                    checklistItem={currentChecklistItem}
                    saveCheckPoint={props.saveCheckPoint} />
            );
        }
        case View.Summary: return <SummaryView checklistItems={props.checklistItems} />;
        case View.ChangingPhase: return <ChangingPhaseView newPhase={props.newPhase} />;
        default: return null;
    }
};
