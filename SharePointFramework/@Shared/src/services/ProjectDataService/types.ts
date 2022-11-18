import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { IItem } from '@pnp/sp/items'
import { IList } from '@pnp/sp/lists'
import { IEntityField, SpEntityPortalService } from 'sp-entityportal-service'

export interface IProjectDataServiceConfiguration {
  projectWebUrl: string
  projectSiteId: string
  spfxContext: WebPartContext | ListViewCommandSetContext | ApplicationCustomizerContext
  entityService: SpEntityPortalService
  propertiesListName: string
}

export interface IPropertyItemContext {
  itemId?: number
  listId?: string
  defaultEditFormUrl?: string
  list?: IList
  item?: IItem
}

export interface IGetPropertiesData {
  /**
   * EditForm url
   */
  editFormUrl?: string

  /**
   * Version history url
   */
  versionHistoryUrl?: string

  /**
   * Field values
   */
  fieldValues?: Record<string, any>

  /**
   * Field values as text
   */
  fieldValuesText?: Record<string, string>

  /**
   * Entity fields
   */
  fields?: IEntityField[]

  /**
   * Properties list id
   */
  propertiesListId?: string

  /**
   *
   */
  templateParameters?: Record<string, any>
}
