import { AnyAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProgramAdministrationProps, IProgramAdministrationState } from './types'
import { IProgramHub } from 'data/types'

export interface IProgramAdministrationContext {
  props: IProgramAdministrationProps
  state: IProgramAdministrationState
  dispatch: React.Dispatch<AnyAction>
  programHubs?: IProgramHub[]
}

export const ProgramAdministrationContext = createContext<IProgramAdministrationContext>(null)
