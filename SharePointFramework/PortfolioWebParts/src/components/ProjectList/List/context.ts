import { ProjectListModel } from 'pp365-shared-library/lib/models'
import { createContext } from 'react'
import { IProjectListProps } from '../types'

/**
 * Interface representing the context for the Project List component.
 */
export interface IListContext extends IProjectListProps {
  /**
   * Projects to be rendered in the list.
   */
  projects?: ProjectListModel[]

  /**
   * Size that determines the list appearance.
   */
  size?: 'extra-small' | 'small' | 'medium'

  /**
   * Checks if the metadata with the given key should be displayed
   */
  shouldDisplay?: (key: string) => boolean
}

/** Projects and display settings shared by the table and its column renderers. */
export const ListContext = createContext<IListContext>(null)
