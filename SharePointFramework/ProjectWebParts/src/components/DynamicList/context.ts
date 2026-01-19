import { createContext } from 'react'
import type { IWeb } from '@pnp/sp/webs'
import { IDynamicListProps, IDynamicListState } from './types'

export interface IDynamicListContext {
  props: IDynamicListProps
  state: IDynamicListState
  setState: (newState: Partial<IDynamicListState>, callback?: () => void) => void
  /**
   * The web instance to use for all operations, computed once based on webContextMode.
   * Points to the site where the list exists (current project, hub, or custom site).
   */
  web: IWeb
}

export const DynamicListContext = createContext<IDynamicListContext>(null)
