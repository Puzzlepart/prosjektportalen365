import { DefaultButton, DialogFooter, PrimaryButton } from '@fluentui/react'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { DISMISS_CHANGE_PHASE_DIALOG } from '../../..//ProjectPhases/reducer'
import { ProjectPhasesContext } from '../../../ProjectPhases/context'
import { useChangePhase } from '../../useChangePhase'
import { View } from '../Views'
import { ChangePhaseDialogContext } from '../context'
import { SET_VIEW } from '../reducer'

export const Footer: FC = () => {
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
    <DialogFooter>
      <DefaultButton
        text={strings.CancelText}
        onClick={() => context.dispatch(DISMISS_CHANGE_PHASE_DIALOG())}
      />
      {actions.map((buttonProps, index) => (
        <PrimaryButton key={index} {...buttonProps} />
      ))}
    </DialogFooter>
  )
}
