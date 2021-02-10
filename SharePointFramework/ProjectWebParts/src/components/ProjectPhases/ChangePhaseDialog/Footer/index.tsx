import { ProjectPhasesContext } from 'components/ProjectPhases/context'
import { DISMISS_CHANGE_PHASE_DIALOG } from 'components/ProjectPhases/reducer'
import { DefaultButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button'
import { DialogFooter } from 'office-ui-fabric-react/lib/Dialog'
import * as strings from 'ProjectWebPartsStrings'
import React, { useContext } from 'react'
import { ChangePhaseDialogContext } from '../context'
import { SET_VIEW } from '../reducer'
import { View } from '../Views'

export const Footer = () => {
  const context = useContext(ProjectPhasesContext)
  const { state, dispatch } = useContext(ChangePhaseDialogContext)
  const actions = []

  // eslint-disable-next-line default-case
  switch (state.view) {
    case View.Initial:
      {
        actions.push({
          text: strings.Skip,
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
            await context.onChangePhase()
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
    <DialogFooter>
      {actions.map((buttonProps, index) => (
        <PrimaryButton key={index} {...buttonProps} />
      ))}
      <DefaultButton
        text={strings.CloseText}
        onClick={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}
      />
    </DialogFooter>
  )
}
