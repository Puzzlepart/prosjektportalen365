import { TemplateItem } from 'models'
import { SPFolder } from 'pp365-shared-library'
import { createContext } from 'react'

export interface ITemplateSelectorContext {
  /**
   * Templates
   */
  templates?: TemplateItem[]

  /**
   * Libraries
   */
  libraries?: SPFolder[]

  /**
   * Current library
   */
  currentLibrary?: SPFolder

  /**
   * Template library
   */
  templateLibrary?: { title: string; url: string }
}

export const TemplateSelectorContext = createContext<ITemplateSelectorContext>(null)
