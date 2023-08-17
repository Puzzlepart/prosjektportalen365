import { createContext } from 'react'
import { IProjectListProps } from '../types'
import { ProjectListModel } from 'pp365-shared-library/lib/models'

export interface IListContext extends IProjectListProps {
  /**
   * Projects
   */
  projects?: ProjectListModel[]

  /**
   * Size that determines the list appearance
   */
  size?: 'extra-small' | 'small' | 'medium'
}

export const ListContext = createContext<IListContext>(null)
