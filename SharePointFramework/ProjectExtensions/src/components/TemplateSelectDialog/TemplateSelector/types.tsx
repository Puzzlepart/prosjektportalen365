import { HTMLProps } from 'react'
import { ProjectTemplate } from '../../../models'

export interface ITemplateSelectorProps extends Omit<HTMLProps<HTMLDivElement>, 'onChange'> {
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
