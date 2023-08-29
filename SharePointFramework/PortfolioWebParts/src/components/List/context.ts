import { createContext, useContext } from 'react'
import { IListProps } from './types'

export interface IListContext {
  props: IListProps
}

export const ListContext = createContext<IListContext>(null)

export const useListContext = () => useContext(ListContext)