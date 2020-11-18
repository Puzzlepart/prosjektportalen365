import { IProjectSetupData } from '../../extensions/projectSetup/IProjectSetupData'
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps'
import { ITemplateSelectDialogState } from './ITemplateSelectDialogState'

export interface ITemplateSelectDialogProps extends IBaseDialogProps {
  /**
   * Data
   */
  data: IProjectSetupData

  /**
   * On submit callback
   */
  onSubmit: (data: ITemplateSelectDialogState) => void
}
