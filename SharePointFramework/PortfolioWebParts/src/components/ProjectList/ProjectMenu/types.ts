import { ButtonProps } from '@fluentui/react-components'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { IProjectListProps } from '../types'

export interface IProjectMenu extends Pick<ButtonProps, 'appearance' | 'size'> {
  /**
   * Project to show menu for
   */
  project: ProjectListModel

  /**
   * Context to pass to the menu
   */
  context: IProjectListProps
}
