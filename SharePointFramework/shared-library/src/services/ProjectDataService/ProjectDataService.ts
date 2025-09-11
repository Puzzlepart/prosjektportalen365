import { format } from '@fluentui/react'
import { AssignFrom, IPnPClientStore, PnPClientStorage, dateAdd } from '@pnp/core'
import { ConsoleListener, Logger } from '@pnp/logging'
import { IWeb, SPFI, spfi } from '@pnp/sp/presets/all'
import { DefaultCaching, createSpfiInstance, getItemFieldValues } from '../../data'
import {
  ChecklistItemModel,
  ChecklistSPItem,
  DocumentTypeModel,
  ItemFieldValues,
  ProjectPhaseChecklistData,
  ProjectPhaseModel,
  SPField
} from '../../models'
import { getClassProperties, tryParseJson } from '../../util'
import {
  ILocalProjectInformationItemContext,
  IPhaseField,
  IProjectDataServiceParams,
  IProjectInformationData
} from './types'
import { DataService } from '../DataService'
import '@pnp/sp/presets/all'

export class ProjectDataService extends DataService<IProjectDataServiceParams> {
  /**
   * Storage instance
   */
  private _storage: IPnPClientStore

  /**
   * Storage keys for the different functions
   */
  private _storageKeys: Record<string, string> = {
    _getLocalProjectInformationItemContext: '{0}_local_project_information_item_context'
  }

  /**
   * Instance of `SPFI` from `@pnp/sp/presets/all`
   */
  private _sp: SPFI

  /**
   * Instance of the current web from `@pnp/sp/presets/all`
   */
  public web: IWeb

  /**
   * Creates a new instance of `ProjectDataService`. Initialize the storage and logger,
   * as well as configuring the SPFx context and setting the web from `params.webUrl`.
   *
   * @param _params - Parameters
   */
  constructor(private _params: IProjectDataServiceParams) {
    super(true)
    this._initStorage()
    if (_params.logLevel) {
      Logger.subscribe(ConsoleListener())
      Logger.activeLogLevel = _params.logLevel
    }
    this._sp = createSpfiInstance(this._params.spfxContext)
    this.web = spfi(_params.webUrl).using(AssignFrom(this._sp.web)).web
  }

  /**
   * Retrieves items from a SharePoint list.
   *
   * @param listName - The name of the SharePoint list.
   * @param constructor - Optional constructor function for creating instances of a custom class.
   * @param mapConstructor - Optional constructor function for mapping the retrieved items to a custom class.
   * @param filterFunc - Optional filter function for filtering the retrieved items with properties that
   * cannot be filtered with the SharePoint REST API.
   * @param top - Optional maximum number of items to retrieve.
   *
   * @returns A Promise that resolves to an array of items from the SharePoint list.
   */
  public async getItems<T = any, M = T>(
    listName: string,
    constructor?: new () => T,
    mapConstructor?: new (item: T) => M,
    filterFunc?: (value: M) => boolean,
    top = 500
  ): Promise<M[]> {
    let itemsRef = this.web.lists.getByTitle(listName).items.top(top)
    if (constructor) {
      itemsRef = itemsRef.select(...getClassProperties(constructor))
    }
    const items = await itemsRef<T[]>()
    if (!mapConstructor) return items as unknown as M[]
    let mappedItems = items.map((item) => new mapConstructor(item))
    if (filterFunc) mappedItems = mappedItems.filter(filterFunc)
    return mappedItems
  }

  /**
   * Initialize storage and storage keys. The storage keys are formatted with the site id
   * from `params.siteId`.
   */
  private _initStorage() {
    this._storage = new PnPClientStorage().session
    this._storageKeys = Object.keys(this._storageKeys).reduce((obj, key) => {
      obj[key] = format(this._storageKeys[key], this._params.siteId.replace(/-/g, ''))
      return obj
    }, {})
    this._storage.deleteExpired()
  }

  /**
   * Get storage key for function
   *
   * @param func Function name
   */
  public getStorageKey(func: string) {
    return this._storageKeys[func]
  }

  /**
   * Get local project information item context and cache it for 15 minutes.
   */
  private async _getLocalProjectInformationItemContext(): Promise<ILocalProjectInformationItemContext> {
    const context: Partial<ILocalProjectInformationItemContext> = await this._storage.getOrPut(
      this.getStorageKey('_getLocalProjectInformationItemContext'),
      async () => {
        try {
          this._logInfo(
            `Checking if list ${this._params.propertiesListName} exists in web.`,
            '_getLocalProjectInformationItemContext'
          )
          const [list] = await this.web.lists
            .filter(`Title eq '${this._params.propertiesListName}'`)
            .select('Id')()
          if (!list) {
            this._logInfo(
              `List ${this._params.propertiesListName} does not exist in web.`,
              '_getLocalProjectInformationItemContext'
            )
            return null
          }
          this._logInfo(
            `Checking if there's a entry in list ${this._params.propertiesListName}.`,
            '_getLocalProjectInformationItemContext'
          )
          const [item] = await this.web.lists.getById(list.Id).items.select('Id').top(1)<
            { Id: number }[]
          >()
          if (!item) {
            this._logInfo(
              `No entry found in list ${this._params.propertiesListName}.`,
              '_getLocalProjectInformationItemContext'
            )
            return null
          }
          this._logInfo(
            `Entry with ID ${item.Id} found in list ${this._params.propertiesListName}.`,
            '_getLocalProjectInformationItemContext'
          )
          return {
            itemId: item.Id,
            listId: list.Id
          }
        } catch (error) {
          return null
        }
      },
      dateAdd(new Date(), 'minute', 15)
    )
    const list = this.web.lists.getById(context.listId)
    const item = list.items.getById(context.itemId)
    return {
      ...context,
      list,
      item
    } as ILocalProjectInformationItemContext
  }

  /**
   * Get project information from the local project information item
   * in the properties list.
   *
   * Returns the following properties:
   * - `fieldValuesText`: Field values in text format
   * - `fieldValues`: Field values in object format
   * - `fields`: All fields in the list
   * - `versionHistoryUrl`: Version history URL
   * - `propertiesListId`: List ID of the properties list
   *
   * Returns null if no properties are found.
   *
   * @remarks The queries `ctx.item.fieldValuesAsText()` and `ctx.item()` needs to be run
   * separately, as expanding `ctx.item()` with `FieldValuesAsText` will result in
   * corrupt data.
   */
  private async _getLocalProjectInformationItem(
    fieldsFilter = "substringof('Gt', InternalName)"
  ): Promise<IProjectInformationData> {
    try {
      const ctx = await this._getLocalProjectInformationItemContext()
      if (!ctx) return null
      const fields = await ctx.list.fields
        .select(...getClassProperties(SPField))
        .filter(fieldsFilter)<SPField[]>()
      const userFields = fields
        .filter((fld) => fld.TypeAsString.indexOf('User') === 0)
        .map((fld) => fld.InternalName)
      const fieldValues = await getItemFieldValues(ctx.item, userFields)
      const propertiesData: IProjectInformationData = {
        fieldValues,
        fields: this._mapFields(fields),
        versionHistoryUrl: '{0}/_layouts/15/versions.aspx?list={1}&ID={2}',
        propertiesListId: ctx.listId
      }
      propertiesData.versionHistoryUrl = format(
        propertiesData.versionHistoryUrl,
        this._params.webUrl,
        ctx.listId,
        ctx.itemId
      )
      return propertiesData
    } catch (error) {
      return null
    }
  }

  /**
   * Get project information data from the local project information item, with fallback
   * to the item in the portal site.
   *
   * Returns the following properties:
   * - `fieldValuesText`: Field values in text format
   * - `fieldValues`: Field values in object format
   * - `fields`: All fields in the list
   * - `versionHistoryUrl`: Version history URL
   * - `propertiesListId`: List ID of the properties list
   * - `templateParameters`: Template parameters
   */
  public async getProjectInformationData(): Promise<IProjectInformationData> {
    let data: IProjectInformationData = null
    const item = await this._getLocalProjectInformationItem()
    if (item) {
      const templateParameters = tryParseJson(
        item.fieldValues.get('TemplateParameters', { format: 'text' }),
        {}
      )
      this._logInfo('Local property item found.', 'getPropertiesData')
      data = {
        ...item,
        propertiesListId: item.propertiesListId,
        templateParameters
      }
    } else {
      this._logInfo(
        'Local property item not found. Retrieving data from portal site.',
        'getPropertiesData'
      )
      const entity = await this._params.entityService.fetchEntity(
        this._params.siteId,
        this._params.webUrl
      )
      data = {
        fieldValues: new ItemFieldValues(entity.fieldValues, {}),
        fields: entity.fields as any[],
        propertiesListId: null,
        templateParameters: {},
        ...entity.urls
      }
    }
    return data
  }

  /**
   * Get last updated time in seconds since now.
   *
   * @param data Data from `getPropertiesData`
   */
  public async getPropertiesLastUpdated(data: IProjectInformationData): Promise<number> {
    const { Modified } = await this.web.lists
      .getById(data.propertiesListId)
      .items.getById(data.fieldValues.get('Id'))
      .select('Modified')<{ Modified: string }>()
    return (new Date().getTime() - new Date(Modified).getTime()) / 1000
  }

  /**
   * Update phase to the specified `phase` for the project. Updates the local property item, with
   * fallback to updating the entity item if the local property item is not found.
   *
   * @param phase Phase
   * @param phaseField Phase field
   */
  public async updateProjectPhase(
    phase: ProjectPhaseModel,
    phaseField: IPhaseField
  ): Promise<void> {
    const properties = {
      [phaseField.textField]: phase.toString(),
      [`${phaseField.fieldName}Text`]: phase.name
    }
    try {
      const propertyItemContext = await this._getLocalProjectInformationItemContext()
      if (propertyItemContext) await propertyItemContext.item.update(properties)
      await this._params.entityService.updateEntityItem(this._params.siteId, properties)
    } catch (error) {
      throw error
    }
  }

  /**
   * Update properties for the project using the local property list. If `returnData` is true,
   * the updated data from `this.getProjectInformationData` will be returned.
   *
   * @param properties Properties to update
   * @param returnData Return data after update
   */
  public async updateProjectProperties(
    properties: { [key: string]: string },
    returnData = false
  ): Promise<IProjectInformationData | null> {
    try {
      const propertyItemContext = await this._getLocalProjectInformationItemContext()
      if (!propertyItemContext) throw new Error('Local property item not found.')
      await propertyItemContext.item.update(properties)
      if (returnData) {
        return await this.getProjectInformationData()
      }
      return null
    } catch (error) {
      throw error
    }
  }

  /**
   * Get phases for the project.
   *
   * @param termSetId Term set ID
   * @param checklistData Checklist data
   */
  public async getPhases(
    termSetId: string,
    checklistData: { [termGuid: string]: ProjectPhaseChecklistData } = {}
  ): Promise<ProjectPhaseModel[]> {
    const [terms, web] = await Promise.all([
      this._sp.termStore.sets
        .getById(termSetId)
        .terms.select('*', 'localProperties')
        .using(DefaultCaching)(),
      this._sp.web.select('Language')()
    ])
    return terms.map(
      (term) => new ProjectPhaseModel(term, termSetId, checklistData[term.id], web.Language)
    )
  }

  /**
   * Get document types for the project.
   *
   * @param termSetId Term set ID
   */
  public async getDocumentTypes(termSetId: string): Promise<DocumentTypeModel[]> {
    const [terms, web] = await Promise.all([
      this._sp.termStore.sets
        .getById(termSetId)
        .terms.select('*', 'localProperties')
        .using(DefaultCaching)(),
      this._sp.web.select('Language')()
    ])
    return terms.map((term) => new DocumentTypeModel(term, termSetId, web.Language))
  }

  /**
   * Get current phase name for the project.
   *
   * @param phaseField Phase field name
   */
  public async getCurrentPhaseName(phaseField: string): Promise<string> {
    try {
      const propertiesData = await this.getProjectInformationData()
      return propertiesData.fieldValues.get(phaseField, { format: 'text' })
    } catch (error) {
      throw new Error()
    }
  }

  /**
   * Get checklist data from the specified list as an object. Returns an object
   * with term GUID as the key, and the items for the term GUID and the stats
   * for the different statuses as the value.
   *
   * @param listName List name
   *
   * @returns An object with term GUID as the key, and the items for the term GUID
   * as the value.
   */
  public async getChecklistData(
    listName: string
  ): Promise<Record<string, ProjectPhaseChecklistData>> {
    try {
      const checklistItems = await this.getItems<ChecklistSPItem, ChecklistItemModel>(
        listName,
        ChecklistSPItem,
        ChecklistItemModel,
        (item) => !!item.termGuid
      )
      const checklistData = checklistItems.reduce((obj, item) => {
        const { termGuid, status } = item
        obj[termGuid] = obj[termGuid]
          ? obj[termGuid]
          : {
              stats: {},
              items: []
            }
        obj[termGuid].items.push(item)
        obj[termGuid].stats[status] = obj[termGuid].stats[status]
          ? obj[termGuid].stats[status] + 1
          : 1
        return obj
      }, {})
      return checklistData
    } catch (e) {
      return {}
    }
  }

  /**
   * Update checklist item
   *
   * @param listName List name
   * @param id Id
   * @param properties Properties
   */
  public async updateChecklistItem(listName: string, id: number, properties: Record<string, any>) {
    return await this.web.lists.getByTitle(listName).items.getById(id).update(properties)
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    Object.keys(this._storageKeys).forEach((name) => {
      const key = this.getStorageKey(name)
      Logger.write(`(ProjectDataService) Clearing key ${key} from sessionStorage.`)
      sessionStorage.removeItem(key)
    })
  }

  /**
   * Get welcome page for the project web. If the user doesn't have access to the root folder,
   * the default page will be returned.
   */
  public async getWelcomePage() {
    try {
      const { WelcomePage } = await this.web.rootFolder.select('WelcomePage')()
      return WelcomePage
    } catch (error) {
      return 'SitePages/ProjectHome.aspx'
    }
  }

  private _logInfo(message: string, method: string) {
    Logger.write(`(ProjectDataService) (${method}) ${message}`)
  }
}
