import Dialog, { DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import  * as strings from 'ProjectWebPartsStrings'
import React, { useContext, useState } from 'react'
import { isEmpty } from 'underscore'
import { ProjectPhasesContext } from '../context'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../reducer'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { Footer } from './Footer'
import { getNextIndex, nextCheckpoint } from './nextCheckpoint'
import { IChangePhaseDialogState } from './types'
import { View } from './Views'


export const ChangePhaseDialog = () => {
  const context = useContext(ProjectPhasesContext)
  if (!context.state.confirmPhase) return null
  const checklistItems = context.state.phase?.checklistData?.items || []
  const openCheclistItems = checklistItems.filter(item => item.GtChecklistStatus === strings.StatusOpen)
  const [state, setState] = useState<IChangePhaseDialogState>({
    view: isEmpty(openCheclistItems) ? View.Summary : View.Initial,
    checklistItems,
    currentIdx: getNextIndex(checklistItems),
  })

  return (
    <Dialog
      isOpen={true}
      containerClassName={styles.root}
      title={strings.ChangePhaseText}
      subText={
        state.view === View.Confirm && format(strings.ConfirmChangePhase, context.state.confirmPhase.name)
      }
      dialogContentProps={{ type: DialogType.largeHeader }}
      modalProps={{ isDarkOverlay: true, isBlocking: false }}
      onDismiss={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}>
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
