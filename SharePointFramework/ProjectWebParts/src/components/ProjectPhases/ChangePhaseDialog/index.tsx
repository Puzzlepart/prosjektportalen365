import { Dialog, DialogType, format } from '@fluentui/react'
import SPDataAdapter from '../../../data'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useEffect, useReducer } from 'react'
import { ProjectPhasesContext } from '../context'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../reducer'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { ChangePhaseDialogContext } from './context'
import { DynamicHomepageContent } from './DynamicHomepageContent'
import { Footer } from './Footer'
import reducer, { CHECKLIST_ITEM_UPDATED, INIT } from './reducer'
import { View } from './Views'

export const ChangePhaseDialog: FC = () => {
  const context = useContext(ProjectPhasesContext)
  if (!context.state.confirmPhase) return null
  const [state, dispatch] = useReducer(reducer, {})

  useEffect(() => dispatch(INIT({ context })), [])

  /**
   * Next checklist item
   *
   * Updates the current checklist item, and dispatches CHECKLIST_ITEM_UPDATED
   * with the properties
   *
   * @param properties Properties
   */
  const nextChecklistItem = async (properties: Partial<Record<string, any>>) => {
    const currentItem = [...state.checklistItems][state.currentIdx]
    await SPDataAdapter.project.updateChecklistItem(
      strings.PhaseChecklistName,
      currentItem.id,
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
        onDismiss={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}
      >
        {state.view === View.Confirm && context.props.useDynamicHomepage && (
          <DynamicHomepageContent />
        )}
        <Body />
        <Footer />
      </Dialog>
    </ChangePhaseDialogContext.Provider>
  )
}

export * from './types'
