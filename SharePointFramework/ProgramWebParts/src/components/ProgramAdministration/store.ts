import { SPRest } from '@pnp/sp'
import create from 'zustand'
import { addChildProject } from './helpers'
import { ChildProject } from './types'

interface IProgramAdministrationState {
  isLoading: boolean
  childProjects: ChildProject[]
  displayProjectDialog: boolean
  availableProjects: ChildProject[]
  selectedProjectsToDelete: ChildProject[]
  toggleProjectDialog: () => void
  toggleLoading: () => void
  setChildProjects: (projects: ChildProject[]) => void
  setAvailableProjects: (projects: ChildProject[]) => void
  addChildProject: (project: ChildProject, _sp: SPRest) => void
  setSelectedToDelete: (project: ChildProject[]) => void
}

export const useStore = create<IProgramAdministrationState>((set) => ({
  isLoading: false,
  displayProjectDialog: false,
  childProjects: [],
  availableProjects: [],
  selectedProjectsToDelete: null,

  toggleLoading: () => set((state) => ({ isLoading: !state.isLoading })),

  toggleProjectDialog: () =>
    set((state) => ({ displayProjectDialog: !state.displayProjectDialog })),

  setAvailableProjects: (projects) => set(() => ({ availableProjects: projects })),

  setChildProjects: (projects) => set(() => ({ childProjects: projects })),

  addChildProject: (project) =>
    set((state) => ({ childProjects: [...state.childProjects, project] })),

  setSelectedToDelete: (project) => set(() => ({ selectedProjectsToDelete: project }))
}))
