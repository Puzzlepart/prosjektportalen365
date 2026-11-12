import { UnknownAction } from '@reduxjs/toolkit'
import { createContext } from 'react'
import { IProgramAdministrationProps, IProgramAdministrationState } from './types'
import { IProgramHub } from 'data/types'

/** Administration props, reducer state and resolved hubs shared by the project lists. */
export interface IProgramAdministrationContext {
  props: IProgramAdministrationProps
  state: IProgramAdministrationState
  dispatch: React.Dispatch<UnknownAction>
  programHubs?: IProgramHub[]
}

/** Shares program administration state and actions with its lists and dialog. */
export const ProgramAdministrationContext = createContext<IProgramAdministrationContext>(null)
