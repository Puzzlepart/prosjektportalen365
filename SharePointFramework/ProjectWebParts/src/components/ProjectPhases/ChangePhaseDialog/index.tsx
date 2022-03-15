import SPDataAdapter from 'data'
import { Icon } from 'office-ui-fabric-react'
import Dialog, { DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext, useEffect, useReducer } from 'react'
import { ProjectPhasesContext } from '../context'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../reducer'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { ChangePhaseDialogContext } from './context'
import { Footer } from './Footer'
import reducer, { CHECKLIST_ITEM_UPDATED, INIT } from './reducer'
import { View } from './Views'

export const ChangePhaseDialog = (phaseSitePages?: any) => {
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
   * @param {Partial<IProjectPhaseChecklistItem>} properties Properties
   */
  const nextChecklistItem = async (properties: Partial<IProjectPhaseChecklistItem>) => {
    const currentItem = [...state.checklistItems][state.currentIdx]
    await SPDataAdapter.project.updateChecklistItem(
      strings.PhaseChecklistName,
      currentItem.ID,
      properties
    )
    dispatch(CHECKLIST_ITEM_UPDATED({ properties }))
  }

  console.log(phaseSitePages)

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
        {state.view === View.Confirm && context.props.useDynamicHomepage &&
          <div className={styles.useDynamicHomepageContent}>
            <Icon iconName={'Info'} className={styles.descriptionIcon} />
            {strings.UseDynamicHomepageChangePhaseDescription}phaseSitePages
          </div>
        }
        <Body />
        <Footer />
      </Dialog>
    </ChangePhaseDialogContext.Provider>
  )
}

export * from './types'
