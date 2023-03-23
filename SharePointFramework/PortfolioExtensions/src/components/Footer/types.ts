import { IInstallationEntry } from 'extensions/footer/types'
import {PageContext} from '@microsoft/sp-page-context'
import { createContext } from 'react'

export interface IFooterProps {
  installEntries: IInstallationEntry[]
  pageContext: PageContext
}

export interface IFooterContext {
  latestEntry: IInstallationEntry
  props: IFooterProps
}

export const FooterContext = createContext<IFooterContext>(null)