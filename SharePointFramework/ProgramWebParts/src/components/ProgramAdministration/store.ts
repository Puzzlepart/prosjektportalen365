import create from 'zustand'
import { IChildProject } from './types'

interface IProgramAdministrationState {
  isLoading: boolean
  projects: IChildProject[]
  displayProjectDialog: boolean
  toggleProjectDialog: () => void
  toggleLoading: () => void
  setProjects: (project: IChildProject[]) => void
}

export const useStore = create<IProgramAdministrationState>((set) => ({
  isLoading: false,
  projects: [],
  displayProjectDialog: false,
  toggleLoading: () => set((state) => ({ isLoading: !state.isLoading })),
  setProjects: (projects) => set(() => ({ projects: projects })),
  toggleProjectDialog: () => set((state) => ({ displayProjectDialog: !state.displayProjectDialog }))
}))
