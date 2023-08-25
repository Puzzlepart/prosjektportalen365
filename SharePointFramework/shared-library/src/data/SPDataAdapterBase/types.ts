import { LogLevel } from '@pnp/logging'
import { SiteContext } from '../../models'

export interface ISPDataAdapterBaseConfiguration extends SiteContext {
  /**
   * Web URL
   */
  webUrl: string

  /**
   * Site ID (GUID)
   */
  siteId: string

  /**
   * Log level
   */
  logLevel?: LogLevel
}

/**
 * String enum for project admin permissions.
 *
 * @see Templates/Portfolio/Objects/Lists/Prosjektadministrasjonstilganger.xml
 */
export enum ProjectAdminPermission {
  EditProjectProperties = 'edc568a8-9cfc-4547-9af2-d9d3aeb5aa2a',
  ChangePhase = '75a08ae0-d69a-41b2-adf4-ae233c6bff9f',
  ProjectStatusAdmin = 'f6b875ae-fdb4-4ceb-bc75-ed853c2a2b0e',
  ChildProjectsAdmin = '2281c92a-f5ff-4d99-8814-e7b2f33d1ac9'
}

export enum ProjectPropertiesMapType {
  FromPortfolioToProject,
  FromProjectToPortfolio,
  FromPortfolioToPortfolio
}

export type GetMappedProjectPropertiesOptions = {
  /**
   * Wrap multi values in results array.
   */
  wrapMultiValuesInResultsArray?: boolean

  /**
   * Use SharePoint taxonomy hidden fields to set the value for taxonomy fields.
   * Default is using the custom text fields.
   *
   * @note `targetListName` must be set for this to work.
   */
  useSharePointTaxonomyHiddenFields?: boolean

  /**
   * Target list name to map the project properties for.
   */
  targetListName?: string

  /**
   * Map type decides what will be the source and destination webs for the mapping.
   */
  mapType?: ProjectPropertiesMapType

  /**
   * Project content type ID if different from the default.
   */
  projectContentTypeId?: string

  /**
   * Custom site fields group name to get fields from in addition to fields
   * with prefix `Gt`.
   */
  customSiteFieldsGroup?: string
}
