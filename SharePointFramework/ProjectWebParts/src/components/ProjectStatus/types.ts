import { PageContext } from '@microsoft/sp-page-context'
import {
  IProjectInformationData,
  ProjectColumnConfig,
  SectionModel,
  SPField,
  StatusReport
} from 'pp365-shared-library/lib'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage/types'
import { IOpportunityMatrixProps } from '../OpportunityMatrix'
import { IRiskMatrixProps } from '../RiskMatrix'

export interface IProjectStatusProps extends IBaseWebPartComponentProps {
  riskMatrix?: IRiskMatrixProps
  opportunityMatrix?: IOpportunityMatrixProps
  fieldWidth?: number
  pageContext?: PageContext

  /**
   * File name for the persisted section data attachment stored in a separate
   * hidden library. This is used to persist the section data when the report
   * is published.
   */
  persistSectionDataAttachmentFileName?: string

  /**
   * File name for the snapshot attachment stored in a separate hidden library.
   */
  snapshotAttachmentFileName?: string
}

export interface IProjectStatusState extends IBaseWebPartComponentState<IProjectStatusData> {
  /**
   * Source URL
   */
  sourceUrl?: string

  /**
   * Selected report
   */
  selectedReport?: StatusReport

  /**
   * Hash state from URL
   */
  hashState?: Map<string, string | number>

  /**
   * Is the report being published?
   */
  isPublishing?: boolean

  /**
   * `ID` of the most recent report
   */
  mostRecentReportId?: number

  /**
   * Current user has admin permissions
   */
  userHasAdminPermission?: boolean

  /**
   * Persisted section list data
   */
  persistedSectionData?: Record<string, any>

  /**
   * User message to display in the UI
   */
  userMessage?: Pick<IUserMessageProps, 'text' | 'type'>
}

export interface IProjectStatusData {
  /**
   * Entity item
   */
  properties?: IProjectInformationData

  /**
   * Status report fields
   */
  reportFields?: SPField[]

  /**
   * Default edit form URL for status reports
   */
  reportEditFormUrl?: string

  /**
   * Reports
   */
  reports?: StatusReport[]

  /**
   * Sections
   */
  sections?: SectionModel[]

  /**
   * Column configuration
   */
  columnConfig?: ProjectColumnConfig[]

  /**
   * Current user has admin permissions
   */
  userHasAdminPermission?: boolean
}
