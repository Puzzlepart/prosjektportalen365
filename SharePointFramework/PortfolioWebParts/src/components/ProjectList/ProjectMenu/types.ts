import { ButtonProps } from '@fluentui/react-components'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { IProjectListProps } from '../types'

/** Target project, quick-launch configuration and menu-button appearance. */
export interface IProjectMenu extends Pick<ButtonProps, 'appearance' | 'size' | 'disabled'> {
  /**
   * Project to show menu for
   */
  project: ProjectListModel

  /**
   * Context to pass to the menu
   */
  context: IProjectListProps
}
