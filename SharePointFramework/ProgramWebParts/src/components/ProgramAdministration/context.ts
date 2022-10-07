import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProgramAdministrationProps, IProgramAdministrationState } from './types'

export interface IProgramAdministrationContext {
  state: IProgramAdministrationState
  props: IProgramAdministrationProps
  dispatch: React.Dispatch<AnyAction>
}

export const ProgramAdministrationContext = createContext<IProgramAdministrationContext>(null)
