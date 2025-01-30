import {
  DataSource,
  EditableSPField,
  ItemFieldValues,
  ProjectContentColumn,
  SPField
} from 'pp365-shared-library'
import { MessageBarType } from '@fluentui/react'
import { IdeaConfigurationModel } from 'models'
import { Slot } from '@fluentui/react-components'
import { IPortfolioAggregationProps } from 'components/PortfolioAggregation'

export class IdeaModuleErrorMessage extends Error {
  constructor(public message: string, public type: MessageBarType) {
    super(message)
  }
}

export interface IIdeaModuleProps extends IPortfolioAggregationProps {
  ideaConfigurationList: string
  ideaConfiguration: string
  sortBy?: string
  showSearchBox?: boolean
  showRenderModeSelector?: boolean
  showSortBy?: boolean
  defaultRenderMode?: IdeaListRenderMode
  listSize?: 'extra-small' | 'small' | 'medium'
  hiddenRegFields?: string[]
  hiddenProcFields?: string[]
  provisionUrl?: string
}

export interface IIdeaModuleState {
  loading?: boolean
  refetch?: number
  isRefetching?: boolean
  error?: any
  configuration?: IdeaConfigurationModel
  ideas?: Idea
  selectedIdea?: IIdea
  selectedView?: DataSource
  phase?: IdeaPhase
  searchTerm: string
  renderMode?: IdeaListRenderMode
  isUserInIdeaManagerGroup?: boolean
  sort?: { fieldName: string; isSortedDescending: boolean }
}

export type IdeaListRenderMode = 'tiles' | 'list' | 'compactList'

export interface IIdeaModuleHashState {
  viewId?: string
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

export interface IIdeaPhase {
  phase: IdeaPhase
  name: string
  icon?: Slot<'span'>
}

export enum IdeaPhase {
  Registration,
  Processing,
  ApprovedForConcept,
  Provisioned
}
