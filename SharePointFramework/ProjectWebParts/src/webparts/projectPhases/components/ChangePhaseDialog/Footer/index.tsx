//#region Imports
import * as React from "react";
import { DialogFooter } from "office-ui-fabric-react/lib/Dialog";
import { PrimaryButton, DefaultButton } from "office-ui-fabric-react/lib/Button";
import { View } from "../Views";
import IFooterProps from "./IFooterProps";
import * as strings from 'ProjectPhasesWebPartStrings';
//#endregion

/**
 * Footer
 */
export const Footer = ({ isLoading, newPhase, currentView, onChangeView, onChangePhase, onDismiss }: IFooterProps) => {
    let actions = [];

    switch (currentView) {
        case View.Initial: {
            actions.push({
                text: strings.Skip,
                disabled: isLoading,
                onClick: () => onChangeView(View.Confirm),
            });
        }
            break;
        case View.Confirm: {
            actions.push({
                text: strings.Yes,
                disabled: isLoading,
                onClick: async () => {
                    onChangeView(View.ChangingPhase);
                    await onChangePhase(newPhase);
                    onDismiss(null, true);
                },
            });
        }
            break;
        case View.Summary: {
            actions.push({
                text: strings.MoveOn,
                disabled: isLoading,
                onClick: () => onChangeView(View.Confirm),
            });
        }
            break;
    }

    return (
        <DialogFooter>
            {actions.map((buttonProps, index) => {
                return <PrimaryButton key={`FooterAction_${index}`} {...buttonProps} />;
            })}
            <DefaultButton text={strings.Close} disabled={isLoading} onClick={onDismiss} />
        </DialogFooter>
    );
};
