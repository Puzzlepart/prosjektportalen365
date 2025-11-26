import { createContext } from 'react'
import { IDynamicListProps, IDynamicListState } from './types'

export interface IDynamicListContext {
  props: IDynamicListProps
  state: IDynamicListState
  setState: (newState: Partial<IDynamicListState>, callback?: () => void) => void
}

export const DynamicListContext = createContext<IDynamicListContext>(null)
