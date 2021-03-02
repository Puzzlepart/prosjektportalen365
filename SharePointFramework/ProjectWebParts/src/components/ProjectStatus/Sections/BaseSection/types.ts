import { StatusReport, SectionModel } from 'pp365-shared/lib/models'
import { IProjectStatusData } from '../..'
import { IStatusElementProps } from '../../StatusElement/types'

export interface IBaseSectionProps {
  /**
   * Section model
   */
  model: SectionModel

  /**
   * Props for section header
   */
  headerProps: IStatusElementProps

  /**
   * The selected report
   */
  report: StatusReport

  /**
   * Data
   */
  data?: IProjectStatusData

  /**
   * URL for the hub site
   */
  hubSiteUrl: string

  /**
   * ID of the site
   */
  siteId: string

  /**
   * URL for the web
   */
  webUrl: string
}

export interface IBaseSectionState {
  /**
   * List items
   */
  listItems?: any[]
}
