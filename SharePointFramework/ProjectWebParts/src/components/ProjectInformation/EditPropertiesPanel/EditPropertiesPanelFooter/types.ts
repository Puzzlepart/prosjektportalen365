import { UseModelReturnType } from '../useModel'
import { UseSubmitReturnType } from '../useSubmit'
import { SpinnerProps } from '@fluentui/react-components'

export interface IEditPropertiesPanelFooterProps {
  /**
   * Submit functions and state.
   */
  submit: UseSubmitReturnType

  /**
   * Model functions and state.
   */
  model: UseModelReturnType
}
