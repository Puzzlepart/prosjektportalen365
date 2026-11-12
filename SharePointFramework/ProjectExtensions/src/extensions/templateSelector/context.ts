import { TemplateItem } from 'models'
import { SPFolder } from 'pp365-shared-library'
import { createContext } from 'react'

/** Hub templates and the command's current destination-library context. */
export interface ITemplateSelectorContext {
  templates?: TemplateItem[]

  libraries?: SPFolder[]

  currentLibrary?: SPFolder

  templateLibrary?: { title: string; url: string }

  /**
   * Current folder URL (server relative) where the command was triggered
   */
  currentFolderUrl?: string
}

/** Shares loaded templates and destination context with the copy wizard. */
export const TemplateSelectorContext = createContext<ITemplateSelectorContext>(null)
