import {
  DataSource,
  EditableSPField,
  ItemFieldValues,
  ProjectContentColumn,
  SPField
} from 'pp365-shared-library'
import { IdeaConfigurationModel } from 'models'
import { Slot, MessageBarProps } from '@fluentui/react-components'
import { IPortfolioAggregationProps } from 'components/PortfolioAggregation'

/** An idea-module error carrying its intended message-bar severity. */
export class IdeaModuleErrorMessage extends Error {
  constructor(
    public message: string,
    public type: MessageBarProps['intent']
  ) {
    super(message)
  }
}

/** Idea configuration, field visibility and inherited overview options. */
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
}

/** Loaded ideas, navigation selection and presentation state. */
export interface IIdeaModuleState {
  loading?: boolean
  refetch?: number
  isRefetching?: boolean
  error?: { title: string; message: string }
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

/** Supported idea-list presentation modes. */
export type IdeaListRenderMode = 'tiles' | 'list' | 'compactList'

/** Idea or overview selection stored in the URL fragment. */
export interface IIdeaModuleHashState {
  viewId?: string
  ideaId?: string
}

/** A selected idea and its editable registration and processing fields. */
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

/** Container for the idea module's joined list data. */
export class Idea {
  data: IIdeasData
}

/** Joined idea items, field metadata and editable values from both workflow lists. */
export interface IIdeasData {
  /**
   * Registered items with their matching processing item.
   */
  items: any[]

  /**
   * Editable values read separately from each workflow list.
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

/** An idea phase with its display name and optional icon slot. */
export interface IIdeaPhase {
  phase: IdeaPhase
  name: string
  icon?: Slot<'span'>
}

/** Stages of the idea-to-project workflow. */
export enum IdeaPhase {
  Registration,
  Processing,
  ApprovedForConcept,
  Provisioned
}
