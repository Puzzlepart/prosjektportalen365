import { TypedHash } from '@pnp/common'
import SPDataAdapter from 'data'
import Dialog, { DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext, useEffect, useReducer } from 'react'
import { ProjectPhasesContext } from '../context'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../reducer'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { ChangePhaseDialogContext } from './context'
import { Footer } from './Footer'
import reducer, { CHECKLIST_ITEM_UPDATED, INIT } from './reducer'
import { INextChecklistItemParams } from './types'
import { View } from './Views'

export const ChangePhaseDialog = () => {
  const context = useContext(ProjectPhasesContext)
  if (!context.state.confirmPhase) return null
  const [state, dispatch] = useReducer(reducer, {})

  useEffect(() => dispatch(INIT({ context })), [])

  const nextChecklistItem = async ({ statusValue, comment }: INextChecklistItemParams) => {
    const currentItem = [...state.checklistItems][state.currentIdx]
    const properties: TypedHash<string> = {
      GtComment: comment,
      GtChecklistStatus: statusValue
    }
    await SPDataAdapter.project.updateChecklistItem(
      strings.PhaseChecklistName,
      currentItem.ID,
      properties
    )
    dispatch(CHECKLIST_ITEM_UPDATED({ properties }))
  }

  return (
    <ChangePhaseDialogContext.Provider value={{ state, dispatch, nextChecklistItem }}>
      <Dialog
        isOpen={true}
        containerClassName={styles.root}
        title={strings.ChangePhaseText}
        subText={
          state.view === View.Confirm &&
          format(strings.ConfirmChangePhase, context.state.confirmPhase.name)
        }
        dialogContentProps={{ type: DialogType.largeHeader }}
        modalProps={{ isDarkOverlay: true, isBlocking: false }}
        onDismiss={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}>
        <Body />
        <Footer />
      </Dialog>
    </ChangePhaseDialogContext.Provider>
  )
}

export * from './types'
