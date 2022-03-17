import SPDataAdapter from 'data'
import { MessageBar, MessageBarType } from 'office-ui-fabric-react'
import Dialog, { DialogType } from 'office-ui-fabric-react/lib/Dialog'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { IProjectPhaseChecklistItem } from 'pp365-shared/lib/models'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext, useEffect, useReducer } from 'react'
import * as ReactMarkdown from 'react-markdown/with-html'
import _ from 'underscore'
import { ProjectPhasesContext } from '../context'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../reducer'
import { Body } from './Body'
import styles from './ChangePhaseDialog.module.scss'
import { ChangePhaseDialogContext } from './context'
import { Footer } from './Footer'
import reducer, { CHECKLIST_ITEM_UPDATED, INIT } from './reducer'
import { View } from './Views'

export const ChangePhaseDialog = () => {
  const context = useContext(ProjectPhasesContext)
  if (!context.state.confirmPhase) return null
  const [state, dispatch] = useReducer(reducer, {})
  const phaseSitePages = context.state.data.phaseSitePages
  const confirmPhaseName = context.state.confirmPhase.name
  const phaseSitePage = phaseSitePages && _.find(phaseSitePages, (p) => p.title === confirmPhaseName)

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

  return (
    <ChangePhaseDialogContext.Provider value={{ state, dispatch, nextChecklistItem }}>
      <Dialog
        isOpen={true}
        containerClassName={styles.root}
        title={strings.ChangePhaseText}
        subText={
          state.view === View.Confirm &&
          format(strings.ConfirmChangePhase, confirmPhaseName)
        }
        dialogContentProps={{ type: DialogType.largeHeader }}
        modalProps={{ isDarkOverlay: true, isBlocking: false }}
        onDismiss={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}>
        {state.view === View.Confirm && context.props.useDynamicHomepage &&
          <div className={styles.dynamicHomepageContent} >
            <MessageBar messageBarType={phaseSitePage ? MessageBarType.info : MessageBarType.warning}>
              <ReactMarkdown escapeHtml={false} source={phaseSitePage
                ? format(strings.PhaseSitePageFoundDescription, phaseSitePage && phaseSitePage.fileLeafRef)
                : format(strings.PhaseSitePageNotFoundDescription, confirmPhaseName)} />
            </MessageBar>
          </div>
        }
        <Body />
        <Footer />
      </Dialog>
    </ChangePhaseDialogContext.Provider>
  )
}

export * from './types'
