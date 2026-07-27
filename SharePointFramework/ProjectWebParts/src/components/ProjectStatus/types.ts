import {
  EditableSPField,
  IProjectInformationData,
  ProjectColumnConfig,
  SectionModel,
  StatusReport
} from 'pp365-shared-library'
import {
  IBaseWebPartComponentProps,
  IBaseWebPartComponentState
} from 'pp365-shared-library/lib/components/BaseWebPartComponent'
import { IUserMessageProps } from 'pp365-shared-library/lib/components/UserMessage/types'
import { IOpportunityMatrixProps } from '../OpportunityMatrix'
import { IRiskMatrixProps } from '../RiskMatrix'

/**
 * Props for the ProjectStatus component.
 */
export interface IProjectStatusProps extends IBaseWebPartComponentProps {
  /**
   * Props for the RiskMatrix component.
   */
  riskMatrix?: IRiskMatrixProps

  /**
   * Props for the OpportunityMatrix component.
   */
  opportunityMatrix?: IOpportunityMatrixProps

  /**
   * The width of the field.
   */
  fieldWidth?: number

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

  /**
   * When `true`, the project can maintain multiple report series
   * ("multirapportering") — one per sub-project ("delprosjekt") defined in
   * `subProjects` — selected through a scope selector in the toolbar. Each
   * report series is identified by a scope key suffix on the `GtSiteId`
   * value (`{siteId}-{scopeKey}`); the default series ("hovedrapportering")
   * has no suffix and behaves exactly as before.
   */
  multiReporting?: boolean

  /**
   * Sub-projects ("delprosjekter") available in the scope selector — one per
   * line on the format `key` or `key|label`. The key becomes part of the
   * stored `GtSiteId` value and is the identity of the report series; the
   * label is display-only and can be renamed freely.
   */
  subProjects?: string
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
   * The currently selected report scope key ("delprosjekt"). An empty string
   * (or `undefined`) means the default report series ("hovedrapportering").
   */
  selectedScope?: string

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
  userMessage?: Pick<IUserMessageProps, 'text' | 'intent'>

  /**
   * The active panel name and optional title. Optional properties and contentID for new reports.
   */
  activePanel?: {
    name: string
    headerText?: string
    reportProps?: Record<string, any>
    contentId?: any
  }

  /**
   * The status for the report (currently selected)
   */
  reportStatus?: string

  /**
   * Timestamp for refetch. Changing this state variable refetches the data in
   * `useProjectStatusDataFetch`.
   */
  refetch?: number
}

export interface IProjectStatusData {
  /**
   * Entity item
   */
  properties?: IProjectInformationData

  /**
   * Status report fields
   */
  reportFields?: EditableSPField[]

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

  /**
   * Distinct scope keys ("delprosjekter") found among the project's status
   * reports (display casing, first-seen). Used by the scope selector so that
   * series whose key is no longer in the configured vocabulary stay reachable.
   */
  scopeKeysWithReports?: string[]
}

/**
 * Represents the result of a data fetch operation.
 */
export type FetchDataResult = {
  data: IProjectStatusData
  initialSelectedReport: StatusReport
  sourceUrl: string

  /**
   * The report scope resolved during the fetch (explicitly selected scope,
   * or derived from the `selectedReport`/`scope` URL parameters on first load).
   * An empty string means the default report series.
   */
  resolvedScope: string
}
