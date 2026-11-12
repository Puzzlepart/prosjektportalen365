import { createContext, useContext } from 'react'
import { IListProps } from './types'

/** List options shared with nested cell renderers. */
export interface IListContext {
  props: IListProps
}

/** Current list options for its header and cells. */
export const ListContext = createContext<IListContext>(null)

/** Read the current hub-list context. */
export const useListContext = () => useContext(ListContext)
