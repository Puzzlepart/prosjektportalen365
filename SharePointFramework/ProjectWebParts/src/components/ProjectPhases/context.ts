import { ProjectPhaseModel } from 'pp365-shared/lib/models/ProjectPhaseModel'
import { createContext } from 'react'
import { IProjectPhasesState } from './types'

export interface IProjectPhasesContext extends IProjectPhasesState {
    /**
    * On change phase
    *
    * @param {ProjectPhaseModel} phase Phase
    */
    onChangePhase: (phase: ProjectPhaseModel) => void
}

export const ProjectPhasesContext = createContext<IProjectPhasesContext>(null)