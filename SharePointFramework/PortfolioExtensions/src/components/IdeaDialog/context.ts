import { createContext } from 'react'
import { IIdeaDialogProps } from './types'

export interface IIDeaDialogContext {
  props: IIdeaDialogProps
}

export const IDeaDialogContext = createContext<IIDeaDialogContext>(null)
