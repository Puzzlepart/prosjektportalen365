import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IDocumentTemplateDialogState } from './types'

export interface IDocumentTemplateDialogContext {
  state: IDocumentTemplateDialogState
  dispatch: React.Dispatch<AnyAction>
}

export const DocumentTemplateDialogContext = createContext<IDocumentTemplateDialogContext>(null)
