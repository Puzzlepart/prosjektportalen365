import { EditableSPField, ItemFieldValues, SPField } from 'pp365-shared-library'
import { IBaseComponentProps } from '../types'

export interface IIdeaModuleProps extends IBaseComponentProps {
  configurationList: string
  configuration: string
  sortBy?: string
  showSearchBox?: boolean
  showRenderModeSelector?: boolean
  showSortBy?: boolean
  defaultRenderMode?: IdeaListRenderMode
  listSize?: 'extra-small' | 'small' | 'medium'
}

export interface IIdeaModuleState {
  loading?: boolean
  refetch?: number
  isRefetching?: boolean
  error?: any
  configuration?: ConfigurationItem
  ideas?: Ideas
  selectedIdea?: IIdea
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

export interface IIdea {
  /**
   * The item
   */
  item: any[]

  /**
   * The fieldValues for the item
  */
  fieldValues?: EditableSPField[]
}


export class Ideas {
  data: IIdeaData
}

export interface IIdeaData {
  /**
   * The items from the lists containing the field values
   */
  items: any[]

  /**
   * The items from the lists containing the field values
  */
  fieldValues?: ItemFieldValues[]

  /**
   * Fields for the list
   */
  fields?: SPField[]
}
