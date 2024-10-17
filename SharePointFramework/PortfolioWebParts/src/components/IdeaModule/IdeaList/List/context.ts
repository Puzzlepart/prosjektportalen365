import { createContext } from 'react'
import { IdeaListModel } from 'models'
import { IIdeaModuleProps } from 'components/IdeaModule'

/**
 * Interface representing the context for the Project List component.
 */
export interface IListContext extends IIdeaModuleProps {
  /**
   * Ideas to be rendered in the list.
   */
  ideas?: Record<string, IdeaListModel>

  /**
   * Size that determines the list appearance.
   */
  size?: 'extra-small' | 'small' | 'medium'
}

export const ListContext = createContext<IListContext>(null)
