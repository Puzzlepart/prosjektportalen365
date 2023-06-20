import { TemplateItem, SPFolder } from 'models'
import { createContext } from 'react'

export interface ITemplateSelectorContext {
  /**
   * Templates available for this project
   */
  templates?: TemplateItem[]

  /**
   * Libraries available in the site
   */
  libraries?: SPFolder[]

  /**
   * Current library
   */
  currentLibrary?: SPFolder

  /**
   * Template library `title` and `url`
   */
  templateLibrary?: { title: string; url: string }

  /**
   * Error object
   */
  error?: any
}

export const TemplateSelectorContext = createContext<ITemplateSelectorContext>(null)
