import * as React from 'react';
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog';
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button';
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { IConfirmPhaseDialogProps } from "./IConfirmPhaseDialogProps";
import * as format from 'string-format';
import * as strings from 'ProjectPhasesWebPartStrings';

// ConfirmPhaseDialog
const ConfirmPhaseDialog = ({ phase, isChangingPhase, isBlocking, onConfirm }: IConfirmPhaseDialogProps) => {
    return (
        <Dialog
            hidden={false}
            onDismiss={e => onConfirm(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: strings.ConfirmPhaseDialogTitle,
                subText: format(strings.ConfirmPhaseDialogSubText, phase.name),
            }}
            modalProps={{ isBlocking: isBlocking }}>
            {isChangingPhase
                ? (
                    <DialogFooter>
                        <Spinner />
                    </DialogFooter>
                )
                : (
                    <DialogFooter>
                        <PrimaryButton onClick={_event => onConfirm(true)} text={strings.Yes} />
                        <DefaultButton onClick={_event => onConfirm(false)} text={strings.No} />
                    </DialogFooter>
                )}
        </Dialog>
    );
};

export default ConfirmPhaseDialog;