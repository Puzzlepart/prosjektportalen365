import { LogLevel } from '@pnp/logging'
import { IItem } from '@pnp/sp/items'
import { IList } from '@pnp/sp/lists'
import { SpEntityPortalService } from 'sp-entityportal-service'
import { ItemFieldValues, SPField } from '../../models'
import { SPFxContext } from '../../types'

/**
 * Project information data.
 */
export interface IProjectInformationData {
  /**
   * Version history url
   */
  versionHistoryUrl?: string

  /**
   * Field values for the list item
   */
  fieldValues?: ItemFieldValues

  /**
   * Fields for the list
   */
  fields?: SPField[]

  /**
   * Properties list ID
   */
  propertiesListId?: string

  /**
   * Template parameters
   */
  templateParameters?: Record<string, any>
}

/**
 * Local project information item context.
 */
export interface ILocalProjectInformationItemContext {
  /**
   * Item ID
   */
  itemId?: number

  /**
   * List ID in GUID format
   */
  listId?: string

  /**
   * List instance from `@pnp/sp/lists`
   */
  list?: IList

  /**
   * Item instance from `@pnp/sp/items`
   */
  item?: IItem
}

export interface IProjectDataServiceParams {
  /**
   * Web URL
   */
  webUrl: string

  /**
   * Site ID
   */
  siteId: string

  /**
   * Entity service
   */
  entityService: SpEntityPortalService

  /**
   * List name for project properties
   */
  propertiesListName: string

  /**
   * SPFx context
   */
  spfxContext: SPFxContext

  /**
   * Log level
   */
  logLevel?: LogLevel
}
