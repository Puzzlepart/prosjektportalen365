import { createContext } from 'react'
import { IProjectListProps } from '../types'
import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { TableColumnDefinition } from '@fluentui/react-components'

export interface IListContext extends IProjectListProps {
  /**
   * Projects
   */
  projects?: ProjectListModel[]

  /**
   * Size that determines the list appearance
   */
  size?: 'extra-small' | 'small' | 'medium'

  columns?:TableColumnDefinition<ProjectListModel>[]
}

export const ListContext = createContext<IListContext>(null)
