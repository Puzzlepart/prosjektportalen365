import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import {
  IProgramAdministrationProps,
  IProgramAdministrationState
} from './types'

export interface IProgramAdministrationContext {
  props: IProgramAdministrationProps
  state: IProgramAdministrationState
  dispatch: React.Dispatch<AnyAction>
}

export const ProgramAdministrationContext =
  createContext<IProgramAdministrationContext>(null)
