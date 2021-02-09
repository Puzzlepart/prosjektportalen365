import { ITemplateSelectDialogState } from 'components/TemplateSelectDialog'
import { IHubSite } from 'sp-hubsite-service'
import { ListContentConfig, ProjectExtension, ProjectTemplate } from '../../models/index'

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
