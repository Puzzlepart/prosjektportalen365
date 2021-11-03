import { SPRest } from '@pnp/sp'
import create from 'zustand'
import { addChildProject } from './helpers'
import { ChildProject, ProjectChildListItem } from './types'

interface IProgramAdministrationState {
  isLoading: boolean
  childProjects: ChildProject[]
  displayProjectDialog: boolean
  availableProjects: ChildProject[]
  toggleProjectDialog: () => void
  toggleLoading: () => void
  setChildProjects: (projects: ChildProject[]) => void
  setAvailableProjects: (projects: ChildProject[]) => void
  addChildProject: (project: ChildProject, _sp: SPRest) => void
}

export const useStore = create<IProgramAdministrationState>((set) => ({
  isLoading: false,
  displayProjectDialog: false,
  childProjects: [],
  availableProjects: [],

  toggleLoading: () => set((state) => ({ isLoading: !state.isLoading })),

  toggleProjectDialog: () =>
    set((state) => ({ displayProjectDialog: !state.displayProjectDialog })),

  setAvailableProjects: (projects) => set(() => ({ availableProjects: projects })),

  setChildProjects: (projects) => set(() => ({ childProjects: projects })),

  addChildProject: (project) =>
    set((state) => ({ childProjects: [...state.childProjects, project] }))
}))
