import {
  EditableSPField,
  ItemFieldValues,
  ProjectContentColumn,
  SPField
} from 'pp365-shared-library'
import { IBaseComponentProps } from '../types'
import { MessageBarType } from '@fluentui/react'
import { IdeaConfigurationModel } from 'models'

export class IdeaModuleErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IIdeaModuleProps extends IBaseComponentProps {
  configurationList: string
  configuration: string
  sortBy?: string
  showSearchBox?: boolean
  showRenderModeSelector?: boolean
  showSortBy?: boolean
  defaultRenderMode?: IdeaListRenderMode
  listSize?: 'extra-small' | 'small' | 'medium'
  hiddenRegFields?: string[]
  hiddenProcFields?: string[]
}

export interface IIdeaModuleState {
  loading?: boolean
  refetch?: number
  isRefetching?: boolean
  error?: any
  configuration?: IdeaConfigurationModel
  ideas?: Idea
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

export interface IIdea {
  /**
   * The item
   */
  item: any

  /**
   * The fieldValues for the registered fields
   */
  registeredFieldValues?: EditableSPField[]

  /**
   * The fieldValues for the processing fields
   */
  processingFieldValues?: EditableSPField[]
}

export class Idea {
  data: IIdeasData
}

export interface IIdeasData {
  /**
   * The items from the lists containing the field values
   */
  items: any[]

  /**
   * The items from the lists containing the field values
   */
  fieldValues?: {
    registered: ItemFieldValues[]
    processing: ItemFieldValues[]
  }

  /**
   * Fields for the list
   */
  fields?: {
    registered: SPField[]
    processing: SPField[]
  }

  /**
   * Columns from "Prosjektinnholdskolonner" list
   */
  columns: ProjectContentColumn[]
}
