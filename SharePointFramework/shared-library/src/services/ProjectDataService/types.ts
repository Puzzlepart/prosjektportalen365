import { LogLevel } from '@pnp/logging'
import { IItem } from '@pnp/sp/items'
import { IList } from '@pnp/sp/lists'
import { SpEntityPortalService } from '../EntityPortalService'
import { ItemFieldValues, SPField } from '../../models'
import { SPFxContext } from '../../types'

/**
 * Project information data.
 */
export interface IProjectInformationData {
  versionHistoryUrl?: string

  fieldValues?: ItemFieldValues

  fields?: SPField[]

  propertiesListId?: string

  templateParameters?: Record<string, any>
}

/**
 * Local project information item context.
 */
export interface ILocalProjectInformationItemContext {
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

/**
 * Configures project-site clients, property-list access and logging.
 */
export interface IProjectDataServiceParams {
  webUrl: string

  siteId: string

  entityService: SpEntityPortalService

  propertiesListName: string

  spfxContext: SPFxContext

  logLevel?: LogLevel
}

/**
 * Identifies a phase taxonomy field, its term set and hidden text field.
 */
export interface IPhaseField {
  fieldName?: string
  termSetId?: string
  textField?: string
}
