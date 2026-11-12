import { UnknownAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IDocumentTemplateDialogState } from './types'

/** State and actions shared by the document-template dialog's screens. */
export interface IDocumentTemplateDialogContext {
  state: IDocumentTemplateDialogState
  dispatch: React.Dispatch<UnknownAction>
}

/** Connects the dialog footer and screens to the same selection and copy state. */
export const DocumentTemplateDialogContext = createContext<IDocumentTemplateDialogContext>(null)
