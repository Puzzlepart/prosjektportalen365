import { IBaseComponentProps } from '../types'

export interface IIdeaModuleProps extends IBaseComponentProps {
  configurationList: string
  sortBy?: string
  showSearchBox?: boolean
  showRenderModeSelector?: boolean
  showSortBy?: boolean
  defaultRenderMode?: ProjectListRenderMode
}

export interface IIdeaModuleState {
  loading?: boolean
  isRefetching?: boolean
  error?: any
  configuration?: ConfigurationItem[]
  ideas?: Record<string, any>
  searchTerm: string
  renderMode?: ProjectListRenderMode
  isUserInIdeaManagerGroup?: boolean
  sort?: { fieldName: string; isSortedDescending: boolean }
}

export type ProjectListRenderMode = 'tiles' | 'list' | 'compactList'

export interface IIdeaModuleHashState {
  ideaId?: string
}

export class ConfigurationItem {
  title: string
  description: string
  ideaProcessingList: string
  ideaRegistrationList: string
  ideaProcessingChoices: string
  ideaRegistrationChoices: string
}
