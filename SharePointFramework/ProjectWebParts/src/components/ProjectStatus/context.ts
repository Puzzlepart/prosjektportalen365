/* eslint-disable prefer-spread */
import { AnyAction } from '@reduxjs/toolkit'
import { PortalDataService } from 'pp365-shared/lib/services/PortalDataService'
import { createContext } from 'react'
import { IProjectStatusProps, IProjectStatusState } from './types'

export interface IProjectStatusContext {
  props: IProjectStatusProps
  state: IProjectStatusState
  dispatch?: React.Dispatch<AnyAction>
  portalDataService?: PortalDataService
}

export const ProjectStatusContext = createContext<IProjectStatusContext>(null)
