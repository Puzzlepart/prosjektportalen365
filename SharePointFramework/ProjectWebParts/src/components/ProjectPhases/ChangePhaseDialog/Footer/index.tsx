import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import * as strings from 'ProjectWebPartsStrings';
import * as React from 'react';
import { View } from '../Views';
import IFooterProps from './IFooterProps';

/**
 * @component Footer
 */

export const Footer = (props: IFooterProps) => {
    let actions = [];

    switch (props.currentView) {
        case View.Initial: {
            actions.push({
                text: strings.Skip,
                disabled: props.isLoading,
                onClick: () => props.onChangeView(View.Confirm),
            });
        }
            break;
        case View.Confirm: {
            actions.push({
                text: strings.Yes,
                disabled: props.isLoading,
                onClick: async () => {
                    props.onChangeView(View.ChangingPhase);
                    await props.onChangePhase(props.newPhase);
                    props.onDismiss(null, true);
                },
            });
        }
            break;
        case View.Summary: {
            actions.push({
                text: strings.MoveOn,
                disabled: props.isLoading,
                onClick: () => props.onChangeView(View.Confirm),
            });
        }
            break;
    }

    return (
        <DialogFooter>
            {actions.map((buttonProps, index) => <PrimaryButton key={index} {...buttonProps} />)}
            <DefaultButton text={strings.CloseText} disabled={props.isLoading} onClick={props.onDismiss} />
        </DialogFooter>
    );
};
