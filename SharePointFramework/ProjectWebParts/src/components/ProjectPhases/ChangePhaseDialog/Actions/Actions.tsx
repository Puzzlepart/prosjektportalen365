import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { format } from '@fluentui/react'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../../reducer'
import { ProjectPhasesContext } from '../../context'
import { useChangePhase } from '../../useChangePhase'
import { usePhaseHooks } from '../../usePhaseHooks'
import { View } from '../Views'
import { ChangePhaseDialogContext } from '../context'
import { SET_VIEW } from '../reducer'
import { Button, DialogActions } from '@fluentui/react-components'
import SPDataAdapter from '../../../../data'
import { IArchiveConfiguration } from '../Views/ArchiveView/types'

/**
 * Log archive operations to the Archive Log list
 */
const logArchiveOperations = async (
  archiveConfiguration: IArchiveConfiguration,
  webUrl: string,
  currentPhase?: string,
  targetPhase?: string
): Promise<void> => {
  try {
    const phaseTransitionMessage = currentPhase && targetPhase
      ? format(strings.ArchivePhaseTransition, currentPhase, targetPhase)
      : undefined

    if (archiveConfiguration.documents && archiveConfiguration.documents.length > 0) {
      for (const doc of archiveConfiguration.documents) {
        await SPDataAdapter.logDocumentArchive(
          doc.title,
          strings.ArchiveLogStatusInProgress,
          phaseTransitionMessage,
          doc.url || '',
          webUrl
        )
      }
    }

    if (archiveConfiguration.lists && archiveConfiguration.lists.length > 0) {
      for (const list of archiveConfiguration.lists) {
        await SPDataAdapter.logListArchive(
          list.title,
          strings.ArchiveLogStatusInProgress,
          phaseTransitionMessage,
          list.url || '',
          webUrl
        )
      }
    }
  } catch (error) {
    console.error('Error logging archive operations:', error)
  }
}

export const Actions: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useContext(ChangePhaseDialogContext)
  const onChangePhase = useChangePhase()
  const [runHook, runArchiveHook] = usePhaseHooks()
  const actions = []

  const getNextView = () => (context.props.useArchive ? View.Archive : View.Confirm)

  // eslint-disable-next-line default-case
  switch (state.view) {
    case View.Initial:
      {
        actions.push({
          text: strings.Skip,
          onClick: () => dispatch(SET_VIEW({ view: getNextView() })),
          disabled: state.isChecklistMandatory,
          title: state.isChecklistMandatory ? strings.ChecklistMandatory : undefined
        })
      }
      break
    case View.Archive:
      {
        actions.push({
          text: strings.ArchiveContinueText,
          onClick: () => dispatch(SET_VIEW({ view: View.Confirm }))
        })
      }
      break
    case View.Confirm:
      {
        actions.push({
          text: strings.Yes,
          onClick: async () => {
            dispatch(SET_VIEW({ view: View.ChangingPhase }))

            if (state.archiveConfiguration && context.props.useArchive) {
              await logArchiveOperations(
                state.archiveConfiguration,
                context.props.webAbsoluteUrl,
                context.state.phase?.name,
                context.state.confirmPhase.name
              )

              await runArchiveHook(state.archiveConfiguration)
            }

            await onChangePhase()
            context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())
          }
        })
      }
      break
    case View.Summary:
      {
        actions.push({
          text: strings.MoveOn,
          onClick: () => dispatch(SET_VIEW({ view: getNextView() }))
        })
      }
      break
  }

  return (
    <DialogActions>
      <Button
        title={strings.CancelText}
        onClick={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}
      >
        {strings.CancelText}
      </Button>
      {actions.map((buttonProps, index) => (
        <Button appearance='primary' key={index} {...buttonProps}>
          {buttonProps.text}
        </Button>
      ))}
    </DialogActions>
  )
}
