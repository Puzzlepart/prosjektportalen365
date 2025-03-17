import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../../reducer'
import { ProjectPhasesContext } from '../../context'
import { useChangePhase } from '../../useChangePhase'
import { View } from '../Views'
import { ChangePhaseDialogContext } from '../context'
import { SET_VIEW } from '../reducer'
import { Button, DialogActions } from '@fluentui/react-components'

export const Actions: FC = () => {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useContext(ChangePhaseDialogContext)
  const onChangePhase = useChangePhase()
  const actions = []

  // eslint-disable-next-line default-case
  switch (state.view) {
    case View.Initial:
      {
        actions.push({
          text: strings.Skip,
          onClick: () => dispatch(SET_VIEW({ view: View.Confirm })),
          disabled: state.isChecklistMandatory,
          title: state.isChecklistMandatory ? strings.ChecklistMandatory : undefined
        })
      }
      break
    case View.Confirm:
      {
        actions.push({
          text: strings.Yes,
          onClick: async () => {
            dispatch(SET_VIEW({ view: View.ChangingPhase }))
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
          onClick: () => dispatch(SET_VIEW({ view: View.Confirm }))
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
