import { IBaseWebPartComponentProps, IBaseWebPartComponentState } from '../BaseWebPartComponent'
import { ProjectColumnConfig, SectionModel, SPField, StatusReport } from 'pp365-shared/lib/models'
import { IGetPropertiesData } from 'pp365-shared/lib/services'

export interface IProjectStatusProps extends IBaseWebPartComponentProps {
  riskMatrixCalloutTemplate: string
  riskMatrixWidth?: number | string
  riskMatrixHeight?: number | string
  fieldWidth?: number
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
  isPublishing: boolean
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
}
