//#region Imports
import * as React from "react";
import { View, InitialView, SummaryView, ChangingPhaseView } from "../Views";
import IBodyProps from "./IBodyProps";
//#endregion

export const Body = (props: IBodyProps) => {
    switch (props.currentView) {
        case View.Initial: {
            const currentChecklistItem = props.openCheckListItems[props.currentIdx];
            return (
                <InitialView
                    isLoading={props.isLoading}
                    currentChecklistItem={currentChecklistItem}
                    nextCheckPointAction={props.nextCheckPointAction} />
            );
        }
        case View.Summary: {
            return <SummaryView activePhase={props.activePhase} />;
        }
        case View.ChangingPhase: {
            return <ChangingPhaseView newPhase={props.newPhase} />;
        }
        default: {
            return null;
        }
    }
};
