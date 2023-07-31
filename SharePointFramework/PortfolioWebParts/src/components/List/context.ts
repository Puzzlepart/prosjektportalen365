import { createContext } from 'react'
import { IListProps } from './types'

export interface IListContext {
    props: IListProps
}

export const ListContext = createContext<IListContext>(null)
