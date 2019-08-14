import * as React from 'react';
import { View, InitialView, SummaryView, ChangingPhaseView } from '../Views';
import IBodyProps from './IBodyProps';

export const Body = ({
    isLoading,
    currentIdx,
    currentView,
    checklistItems,
    nextCheckPointAction,
    newPhase,
}: IBodyProps) => {
    switch (currentView) {
        case View.Initial: {
            const currentChecklistItem = checklistItems[currentIdx];
            return (
                <InitialView
                    isLoading={isLoading}
                    currentChecklistItem={currentChecklistItem}
                    nextCheckPointAction={nextCheckPointAction} />
            );
        }
        case View.Summary: {
            return <SummaryView checklistItems={checklistItems} />;
        }
        case View.ChangingPhase: {
            return <ChangingPhaseView newPhase={newPhase} />;
        }
        default: {
            return null;
        }
    }
};
