import SPDataAdapter from '../../../data'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext, useEffect, useReducer } from 'react'
import { ProjectPhasesContext } from '../context'
import { Content } from './Content'
import { ChangePhaseDialogContext } from './context'
import { DynamicHomepageContent } from './DynamicHomepageContent'
import { Actions } from './Actions'
import reducer, { CHECKLIST_ITEM_UPDATED, INIT } from './reducer'
import { View } from './Views'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle
} from '@fluentui/react-components'
import { format } from '@fluentui/react'
import styles from './ChangePhaseDialog.module.scss'

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
      <Dialog open>
        <DialogSurface>
          <DialogBody className={styles.changePhaseDialog}>
            <DialogTitle>{strings.ChangePhaseText}</DialogTitle>
            <DialogContent className={styles.dialogContent}>
              {state.view === View.Confirm &&
                format(strings.ConfirmChangePhase, context.state.confirmPhase.name)}
              {state.view === View.Confirm && context.props.useDynamicHomepage && (
                <DynamicHomepageContent />
              )}
              <Content />
            </DialogContent>
            <Actions />
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </ChangePhaseDialogContext.Provider>
  )
}

export * from './types'
