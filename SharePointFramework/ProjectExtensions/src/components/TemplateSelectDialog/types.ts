import { ProjectSetupSettings } from 'extensions/projectSetup/ProjectSetupSettings'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from 'models'
import { IProjectSetupData } from '../../extensions/projectSetup/IProjectSetupData'
import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps'

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

export interface ITemplateSelectDialogState {
  /**
   * Currently selected project templates
   */
  selectedTemplate?: ProjectTemplate

  /**
   * Currently selected extensions
   */
  selectedExtensions?: ProjectExtension[]

  /**
   * Currently selected list content config
   */
  selectedListContentConfig?: ListContentConfig[]

  /**
   * Settings
   */
  settings?: ProjectSetupSettings
}
