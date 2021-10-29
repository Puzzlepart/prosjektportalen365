import create from 'zustand'

interface IProgramAdministrationState {
  isLoading: boolean
  projects: []
  toggleLoading: () => void
}

const useStore = create<IProgramAdministrationState>((set) => ({
  isLoading: false,
  projects: [],
  toggleLoading: () => set((state) => ({ isLoading: !state.isLoading }))
}))
