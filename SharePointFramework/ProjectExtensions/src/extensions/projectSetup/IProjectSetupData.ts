import { ListContentConfig, ProjectTemplate, ProjectExtension } from '../../models/index'
import { IHubSite } from 'sp-hubsite-service'
import { ITemplateSelectDialogState } from '../../components/TemplateSelectDialog/ITemplateSelectDialogState'

export interface IProjectSetupData extends ITemplateSelectDialogState {
  /**
   * Templates
   */
  templates?: ProjectTemplate[]

  /**
   * Extensions
   */
  extensions?: ProjectExtension[]

  /**
   * List content config
   */
  listContentConfig?: ListContentConfig[]

  /**
   * Hub site
   */
  hub?: IHubSite
}
