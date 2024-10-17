import { IBaseComponentProps } from '../types'

export interface IIdeaModuleProps extends IBaseComponentProps {
  configurationList: string
  sortBy?: string
  showSearchBox?: boolean
  showRenderModeSelector?: boolean
  showSortBy?: boolean
  defaultRenderMode?: IdeaListRenderMode
  listSize?: 'extra-small' | 'small' | 'medium'
}

export interface IIdeaModuleState {
  loading?: boolean
  isRefetching?: boolean
  error?: any
  configuration?: ConfigurationItem[]
  ideas?: Record<string, any>
  searchTerm: string
  renderMode?: IdeaListRenderMode
  isUserInIdeaManagerGroup?: boolean
  sort?: { fieldName: string; isSortedDescending: boolean }
}

export type IdeaListRenderMode = 'tiles' | 'list' | 'compactList'

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
