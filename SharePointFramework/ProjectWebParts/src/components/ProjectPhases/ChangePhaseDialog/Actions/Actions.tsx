import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../../reducer'
import { ProjectPhasesContext } from '../../context'
import { useChangePhase } from '../../useChangePhase'
import { usePhaseHooks } from '../../usePhaseHooks'
import { View } from '../Views'
import { ChangePhaseDialogContext } from '../context'
import { SET_VIEW } from '../reducer'
import { Button, DialogActions } from '@fluentui/react-components'
import { logArchiveOperations } from './logArchiveOperations'

export const Actions: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useContext(ChangePhaseDialogContext)
  const onChangePhase = useChangePhase()
  const [runHook, runArchiveHook] = usePhaseHooks()
  const actions = []

  const getNextView = () => (context.props.useArchive ? View.Archive : View.Confirm)

  switch (state.view) {
    case View.Initial:
      {
        actions.push({
          text: strings.Skip,
          onClick: () => dispatch(SET_VIEW({ view: getNextView() })),
          // Focusable while unavailable, so the keyboard reaches the reason in the title.
          disabledFocusable: state.isChecklistMandatory,
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

            let archiveLogError: Error | null = null
            if (state.archiveConfiguration && context.props.useArchive) {
              archiveLogError = await logArchiveOperations(
                state.archiveConfiguration,
                context.props.webAbsoluteUrl,
                context.state.phase?.name,
                context.state.confirmPhase.name
              )

              // The hook gets the archive configuration itself, so it runs also when the log
              // was not written.
              await runArchiveHook(state.archiveConfiguration)
            }

            await onChangePhase(archiveLogError)
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
