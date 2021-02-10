import { TemplateItem, IDocumentLibrary } from 'models'
import { createContext } from 'react'

export interface ITemplateSelectorContext {
  /**
   * Templates
   */
  templates?: TemplateItem[]

  /**
   * Libraries
   */
  libraries?: IDocumentLibrary[]

  /**
   * Template library
   */
  templateLibrary?: { title: string; url: string }
}

export const TemplateSelectorContext = createContext<ITemplateSelectorContext>(null)
