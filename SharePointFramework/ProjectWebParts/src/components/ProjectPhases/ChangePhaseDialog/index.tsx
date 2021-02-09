import Dialog, { DialogType } from 'office-ui-fabric-react/lib/Dialog'
import strings from 'ProjectWebPartsStrings'
import React, { useContext, useState } from 'react'
import { ProjectPhasesContext } from '../context'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { Footer } from './Footer'
import { getNextIndex, nextCheckpoint } from './nextCheckpoint'
import { IChangePhaseDialogProps, IChangePhaseDialogState } from './types'
import { View } from './Views'

/**
 *  subText={
          context.state.currentView === View.Confirm
            ? format(strings.ConfirmChangePhase, this.props.newPhase.name)
            : ''
        }
 */


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const ChangePhaseDialog = (props: IChangePhaseDialogProps) => {
  const context = useContext(ProjectPhasesContext)
  if (!context.state.confirmPhase) return null
  const checklistItems = context.state.data.currentPhase?.checklistData?.items || []
  const [state, setState] = useState<IChangePhaseDialogState>({
    view: View.Initial,
    checklistItems,
    currentIdx: getNextIndex(checklistItems),
  })

  return (
    <Dialog
      isOpen={true}
      containerClassName={styles.root}
      title={strings.ChangePhaseText}
      dialogContentProps={{ type: DialogType.largeHeader }}
      modalProps={{ isDarkOverlay: true, isBlocking: false }}>
      <Body
        view={state.view}
        checklistItems={state.checklistItems}
        currentIdx={state.currentIdx}
        nextCheckpoint={async (data) => {
          const _state = await nextCheckpoint({ ...data, state })
          setState({ ...state, ..._state })
        }} />
      <Footer
        view={state.view}
        setView={view => setState({ ...state, view })} />
    </Dialog>
  )
}

export * from './types'
