import { ProjectTemplate } from '../../../models'

export interface ITemplateSelectorProps {
  /**
   * Project templates
   */
  templates?: ProjectTemplate[]

  /**
   * Currently selected project templates
   */
  selectedTemplate?: ProjectTemplate

  /**
   * On project template changed
   */
  onChange?: (template: ProjectTemplate) => void
}
