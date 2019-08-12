import * as React from "react";
import { DialogFooter } from "office-ui-fabric-react/lib/Dialog";
import { PrimaryButton, DefaultButton } from "office-ui-fabric-react/lib/Button";
import { View } from "../Views";
import IFooterProps from "./IFooterProps";
import * as ProjectPhasesWebPartStrings from 'ProjectPhasesWebPartStrings';

/**
 * Footer
 */
export const Footer = ({ isLoading, newPhase, currentView, onChangeView, onChangePhase, onDismiss }: IFooterProps) => {
    let actions = [];

    switch (currentView) {
        case View.Initial: {
            actions.push({
                text: ProjectPhasesWebPartStrings.Skip,
                disabled: isLoading,
                onClick: () => onChangeView(View.Confirm),
            });
        }
            break;
        case View.Confirm: {
            actions.push({
                text: ProjectPhasesWebPartStrings.Yes,
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
                text: ProjectPhasesWebPartStrings.MoveOn,
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
            <DefaultButton text={ProjectPhasesWebPartStrings.Close} disabled={isLoading} onClick={onDismiss} />
        </DialogFooter>
    );
};
