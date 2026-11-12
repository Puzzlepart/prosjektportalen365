import { createContext } from 'react'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'

/** Footer props and lazily loaded data shared by its controls. */
export interface IFooterContext extends ReturnType<typeof useFooter> {
  props: IFooterProps
}

/** Shares footer data and loaders with its menus and dialogs. */
export const FooterContext = createContext<IFooterContext>(null)
