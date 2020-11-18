import * as React from 'react'
import { Dialog, DialogType, DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import { PrimaryButton, DefaultButton } from 'office-ui-fabric-react/lib/Button'
import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
import { IConfirmPhaseDialogProps } from './types'
import * as format from 'string-format'
import * as strings from 'ProjectWebPartsStrings'

/**
 * @component ConfirmPhaseDialog
 */
const ConfirmPhaseDialog = ({
  phase,
  isChangingPhase,
  isBlocking,
  onConfirm
}: IConfirmPhaseDialogProps) => {
  return (
    <Dialog
      onDismiss={() => onConfirm(false)}
      dialogContentProps={{
        type: DialogType.normal,
        title: strings.ConfirmPhaseDialogTitle,
        subText: format(strings.ConfirmPhaseDialogSubText, phase.name)
      }}
      modalProps={{ isBlocking: isBlocking }}>
      {isChangingPhase ? (
        <DialogFooter>
          <Spinner />
        </DialogFooter>
      ) : (
        <DialogFooter>
          <PrimaryButton onClick={() => onConfirm(true)} text={strings.Yes} />
          <DefaultButton onClick={() => onConfirm(false)} text={strings.No} />
        </DialogFooter>
      )}
    </Dialog>
  )
}

export default ConfirmPhaseDialog
