// import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
// import { Dialog, DialogFooter, DialogType } from 'office-ui-fabric-react/lib/Dialog'
// import { Spinner } from 'office-ui-fabric-react/lib/Spinner'
// import { format } from 'office-ui-fabric-react/lib/Utilities'
// import * as strings from 'ProjectWebPartsStrings'
// import React, { useContext } from 'react'
// import { ProjectPhasesContext } from '../context'
// import { IConfirmPhaseDialogProps } from './types'

// const ConfirmPhaseDialog = ({ isBlocking }: IConfirmPhaseDialogProps) => {
//   const context = useContext(ProjectPhasesContext)
//   return (
//     <Dialog
//       onDismiss={() => onConfirm(false)}
//       dialogContentProps={{
//         type: DialogType.normal,
//         title: strings.ConfirmPhaseDialogTitle,
//         subText: format(strings.ConfirmPhaseDialogSubText, phase.name)
//       }}
//       modalProps={{ isBlocking }}>
//       {isChangingPhase
//         ? (
//           <DialogFooter>
//             <Spinner />
//           </DialogFooter>
//         )
//         : (
//           <DialogFooter>
//             <PrimaryButton onClick={() => onConfirm(true)} text={strings.Yes} />
//             <DefaultButton onClick={() => onConfirm(false)} text={strings.No} />
//           </DialogFooter>
//         )}
//     </Dialog>
//   )
// }

// export default ConfirmPhaseDialog
