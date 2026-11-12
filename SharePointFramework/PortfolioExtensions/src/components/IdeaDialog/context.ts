import { createContext } from 'react'
import { IIdeaDialogProps } from './types'

/** Project-data dialog props exposed through context. */
export interface IIDeaDialogContext {
  props: IIdeaDialogProps
}

/** Context slot for the project-data dialog host. */
export const IDeaDialogContext = createContext<IIDeaDialogContext>(null)
