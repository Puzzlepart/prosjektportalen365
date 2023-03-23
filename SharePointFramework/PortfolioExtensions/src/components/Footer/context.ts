import { InstallationEntry } from 'extensions/footer/types'
import { createContext } from 'react'
import { IFooterProps } from './types'

export interface IFooterContext {
  latestEntry: InstallationEntry
  props: IFooterProps
}

export const FooterContext = createContext<IFooterContext>(null)
