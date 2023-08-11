import { ISpinnerProps } from '@fluentui/react'
import { UseModelReturnType } from '../useModel'
import { UseSubmitReturnType } from '../useSubmit'

export interface IEditPropertiesPanelFooterProps {
  /**
   * Submit functions and state.
   */
  submit: UseSubmitReturnType

  /**
   * Model functions and state.
   */
  model: UseModelReturnType

  /**
   * Spinner props.
   */
  spinner?: ISpinnerProps
}
