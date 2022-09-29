import { SPRest } from '@pnp/sp'
import create from 'zustand'
import { fetchAvailableProjects, getChildProjects, removeChildProjects } from './helpers'
import { ChildProject } from 'models'
import { ChildProjectListItem, UserMessageProps } from './types'
import { MessageBarType } from 'office-ui-fabric-react'
import { WebPartContext } from '@microsoft/sp-webpart-base'

interface IProgramAdministrationState {
  isLoading: boolean
  childProjects: ChildProject[]
  displayProjectDialog: boolean
  availableProjects: ChildProjectListItem[]
  selectedProjectsToDelete: ChildProject[]
  error: UserMessageProps
  toggleProjectDialog: () => void
  toggleLoading: () => void
  setChildProjects: (projects: ChildProject[]) => void
  setAvailableProjects: (projects: ChildProjectListItem[]) => void
  addChildProject: (project: ChildProject, _sp: SPRest) => void
  setSelectedToDelete: (project: ChildProject[]) => void
  fetchChildProjects: (_sp: SPRest, dataAdapter: any) => Promise<void>
  fetchAvailableProjects: (_sp: SPRest, context: WebPartContext) => Promise<void>
  deleteChildProjects: (projects: ChildProject[], _sp: SPRest) => Promise<void>
  setError: (message: string, messageBarType: MessageBarType) => void
}

export const useStore = create<IProgramAdministrationState>((set) => ({
  isLoading: false,
  displayProjectDialog: false,
  childProjects: [],
  availableProjects: [],
  selectedProjectsToDelete: null,
  error: null,

  toggleLoading: () => set((state) => ({ isLoading: !state.isLoading })),

  toggleProjectDialog: () =>
    set((state) => ({ displayProjectDialog: !state.displayProjectDialog })),

  setAvailableProjects: (projects) => set(() => ({ availableProjects: projects })),

  setChildProjects: (projects) => set(() => ({ childProjects: projects })),

  addChildProject: (project) =>
    set((state) => ({ childProjects: [...state.childProjects, project] })),

  setSelectedToDelete: (project) => set(() => ({ selectedProjectsToDelete: project })),

  fetchChildProjects: async (_sp, dataAdapter) => {
    try {
      const children = await getChildProjects(_sp, dataAdapter)
      set(() => ({ childProjects: children }))
    } catch (error) {
      set(() => ({ error: { text: error, messageBarType: MessageBarType.error } }))
    }
  },

  fetchAvailableProjects: async (_sp, context) => {
    try {
      const data = await fetchAvailableProjects(_sp, context)
      set(() => ({ availableProjects: data }))
    } catch (error) {
      set(() => ({ error: { text: error, messageBarType: MessageBarType.error } }))
    }
  },

  deleteChildProjects: async (projects, _sp) => {
    try {
      set(() => ({ isLoading: true }))
      await removeChildProjects(_sp, projects)
      const [data] = await _sp.web.lists
        .getByTitle('Prosjektegenskaper')
        .items.select('GtChildProjects')
        .get()
      const children: ChildProject[] = await JSON.parse(data.GtChildProjects)
      set(() => ({ childProjects: children.filter((a) => a) }))
      set(() => ({ isLoading: false }))
    } catch (error) {
      set(() => ({ isLoading: false }))
      set(() => ({ error: { text: error.message, messageBarType: MessageBarType.error } }))
    }
  },

  setError: (message, messagebarType) =>
    set(() => ({ error: { text: message, messageBarType: messagebarType }, isLoading: false }))
}))
