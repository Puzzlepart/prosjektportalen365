import { createContext } from 'react'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'

export interface IFooterContext extends ReturnType<typeof useFooter> {
  props: IFooterProps
}

export const FooterContext = createContext<IFooterContext>(null)
