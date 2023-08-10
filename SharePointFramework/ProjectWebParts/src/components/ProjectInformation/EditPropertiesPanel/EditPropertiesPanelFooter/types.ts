import { ISpinnerProps } from '@fluentui/react'
import { useModel } from '../useModel'
import { useSubmit } from '../useSubmit'

export interface IEditPropertiesPanelFooterProps {
  /**
   * Submit functions and state.
   */
  submit: ReturnType<typeof useSubmit>

  /**
   * Model functions and state.
   */
  model: ReturnType<typeof useModel>

  /**
   * Spinner props.
   */
  spinner?: ISpinnerProps
}
