import { SPRest } from '@pnp/sp'
import create from 'zustand'
import { fetchAvailableProjects } from './helpers'
import { ChildProject } from 'models'

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
  fetchChildProjects: (_sp: SPRest) => Promise<void>
  fetchAvailableProjects: (_sp: SPRest) => Promise<void>
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

  setSelectedToDelete: (project) => set(() => ({ selectedProjectsToDelete: project })),

  fetchChildProjects: async (_sp) => {
    const [data] = await _sp.web.lists
      .getByTitle('Prosjektegenskaper')
      .items.select('GtChildProjects')
      .get()
    const children: ChildProject[] = await JSON.parse(data.GtChildProjects)

    set(() => ({ childProjects: children.filter((a) => a) }))
  },

  fetchAvailableProjects: async (_sp) => {
    const data = await fetchAvailableProjects(_sp)

    set(() => ({ availableProjects: data }))
  }
}))
