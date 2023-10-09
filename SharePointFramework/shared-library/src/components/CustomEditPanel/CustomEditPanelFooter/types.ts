import { ICustomEditPanelProps } from '../types'
import { UseModelReturnType } from '../useModel'

export interface ICustomEditPanelFooterProps extends ICustomEditPanelProps {
  /**
   * Model functions and state.
   */
  model: UseModelReturnType
}
