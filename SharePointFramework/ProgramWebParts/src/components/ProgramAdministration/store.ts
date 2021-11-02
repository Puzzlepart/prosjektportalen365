import create from 'zustand'
import { IChildProject } from './types'

interface IProgramAdministrationState {
  isLoading: boolean
  childProjects: IChildProject[]
  displayProjectDialog: boolean
  availableProjects: any[]
  toggleProjectDialog: () => void
  toggleLoading: () => void
  setChildProjects: (projects: IChildProject[]) => void
  setAvailableProjects: (projects: any[]) => void
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
  setChildProjects: (projects) => set(() => ({ childProjects: projects }))
}))
