import { PageContext } from '@microsoft/sp-page-context'
import { ProjectColumnConfig, SectionModel, SPField, StatusReport } from 'pp365-shared/lib/models'
import { IGetPropertiesData } from 'pp365-shared/lib/services'
import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { DynamicMatrixColorScaleConfig, DynamicMatrixSize } from '../DynamicMatrix'

export interface IProjectStatusProps extends IBaseWebPartComponentProps {
  riskMatrixCalloutTemplate?: string
  riskMatrixFullWidth?: boolean
  riskMatrixWidth?: number | string
  riskMatrixSize?: DynamicMatrixSize
  riskMatrixColorScaleConfig?: DynamicMatrixColorScaleConfig[]
  fieldWidth?: number
  pageContext?: PageContext
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
   * Hash state
   */
  hashState?: IProjectStatusHashState

  /**
   * Is the report being published?
   */
  isPublishing?: boolean

  /**
   * ID of the most recent report
   */
  mostRecentReportId?: number

  /**
   * Current user has admin permissions
   */
  userHasAdminPermission?: boolean
}

export interface IProjectStatusHashState {
  /**
   * Selected report
   */
  selectedReport?: string
}

export interface IProjectStatusData {
  /**
   * Entity item
   */
  properties?: IGetPropertiesData

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
