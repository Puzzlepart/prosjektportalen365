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
   * When `true`, this status page maintains its own report series keyed by the
   * page's `UniqueId` in the SitePages library (`GtStatusPageId` on the report
   * items). When `false` or not set, the web part behaves as the project's
   * default status page and only shows reports without a status page ID. Only
   * set to `true` through provisioning templates (Prosjekttillegg) — toggling
   * it on an existing page hides the page's report history.
   */
  useSeparateReportSeries?: boolean
}

/**
 * Identity of the status page the web part is placed on, used to scope the
 * report series when `useSeparateReportSeries` is enabled.
 */
export interface IStatusPageInfo {
  /**
   * Unique ID (`UniqueId`) of the page item in the SitePages library, in lowercase.
   */
  id: string

  /**
   * Title of the status page.
   */
  title: string

  /**
   * Site-relative URL of the status page (e.g. `SitePages/Prosjektstatus-2.aspx`).
   */
  url: string
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
   * Identity of the status page the web part is placed on. Only set when the
   * web part is configured with `useSeparateReportSeries`.
   */
  statusPage?: IStatusPageInfo
}

/**
 * Represents the result of a data fetch operation.
 */
export type FetchDataResult = {
  data: IProjectStatusData
  initialSelectedReport: StatusReport
  sourceUrl: string
}
