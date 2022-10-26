import { ProjectSetupSettings } from 'projectSetup/ProjectSetupSettings'
import { IProjectSetupData } from 'projectSetup/types'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from 'models'
import { IBaseDialogProps } from '../@BaseDialog/types'

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
   * Currently selected list content configuration
   */
  selectedListContentConfig?: ListContentConfig[]

  /**
   * Settings
   */
  settings?: ProjectSetupSettings

  /**
   * Height for the Dialog Pivot needs to be fixed
   */
  flexibleHeight?: number
}
