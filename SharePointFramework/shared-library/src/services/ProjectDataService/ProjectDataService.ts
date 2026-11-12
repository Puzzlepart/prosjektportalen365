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
import { getTermStore } from '../../taxonomy'
import { getClassProperties, tryParseJson, format } from '../../util'
import {
  ILocalProjectInformationItemContext,
  IPhaseField,
  IProjectDataServiceParams,
  IProjectInformationData
} from './types'
import { DataService } from '../DataService'
import strings from 'SharedLibraryStrings'
import '@pnp/sp/presets/all'

/**
 * Reads and updates project-site information, phases and checklist data.
 */
export class ProjectDataService extends DataService<IProjectDataServiceParams> {
  private _storage: IPnPClientStore

  private _storageKeys: Record<string, string> = {
    _getLocalProjectInformationItemContext: '{0}_local_project_information_item_context'
  }

  private _sp: SPFI

  public web: IWeb

  /**
   * Creates a new instance of `ProjectDataService`. Initialize the storage and logger,
   * as well as configuring the SPFx context and setting the web from `params.webUrl`.
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
    void this._storage.deleteExpired()
  }

  /**
   * Get storage key for function
   */
  public getStorageKey(func: string) {
    return this._storageKeys[func]
  }

  /**
   * Get local project information item context and cache it for 15 minutes. Returns `null` when
   * the site has no properties list, the list has no item or the list cannot be read.
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
    if (!context) return null
    const list = this.web.lists.getById(context.listId)
    const item = list.items.getById(context.itemId)
    return {
      ...context,
      list,
      item
    } as ILocalProjectInformationItemContext
  }

  /**
   * Reads local project fields, their raw and text values, and the item context.
   * Returns `null` when the properties item is missing or cannot be read.
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
   * Reads local project information with a hub-entity fallback.
   * Returns empty values when neither a local item nor an entity service is available.
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
    } else if (this._params.entityService) {
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
    } else {
      this._logInfo(
        'Local property item not found and no entity service available (hub unavailable).',
        'getPropertiesData'
      )
      data = {
        fieldValues: new ItemFieldValues({}, {}),
        fields: [],
        propertiesListId: null,
        templateParameters: {}
      }
    }
    return data
  }

  /**
   * Get last updated time in seconds since now.
   *
   * @param data Local item context from `getProjectInformationData`; requires a properties list ID.
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
   * @param syncToHub Whether to update the project's entity in the hub too (default `true`).
   * `false` leaves the hub to the caller, which then decides what a failed hub update means.
   *
   * @returns The phase properties written, for the caller to write to the hub
   */
  public async updateProjectPhase(
    phase: ProjectPhaseModel,
    phaseField: IPhaseField,
    syncToHub = true
  ): Promise<Record<string, string>> {
    const properties = {
      [phaseField.textField]: phase.toString(),
      [`${phaseField.fieldName}Text`]: phase.name
    }
    const propertyItemContext = await this._getLocalProjectInformationItemContext()
    if (propertyItemContext) await propertyItemContext.item.update(properties)
    if (syncToHub && this._params.entityService) {
      await this._params.entityService.updateEntityItem(this._params.siteId, properties)
    }
    return properties
  }

  /**
   * Update properties for the project using the local property list. If `returnData` is true,
   * the updated data from `this.getProjectInformationData` will be returned.
   */
  public async updateProjectProperties(
    properties: { [key: string]: string },
    returnData = false
  ): Promise<IProjectInformationData | null> {
    try {
      const propertyItemContext = await this._getLocalProjectInformationItemContext()
      if (!propertyItemContext) {
        throw new Error(
          format(strings.ProjectPropertiesNotFoundErrorText, this._params.propertiesListName)
        )
      }
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
   */
  public async getPhases(
    termSetId: string,
    checklistData: { [termGuid: string]: ProjectPhaseChecklistData } = {}
  ): Promise<ProjectPhaseModel[]> {
    const [terms, web] = await Promise.all([
      getTermStore(this._sp.web)
        .sets.getById(termSetId)
        .terms.select('*', 'localProperties')
        .using(DefaultCaching)
        .all(),
      this._sp.web.select('Language')()
    ])
    return terms.map(
      (term) => new ProjectPhaseModel(term, termSetId, checklistData[term.id], web.Language)
    )
  }

  /**
   * Get document types for the project.
   */
  public async getDocumentTypes(termSetId: string): Promise<DocumentTypeModel[]> {
    const [terms, web] = await Promise.all([
      getTermStore(this._sp.web)
        .sets.getById(termSetId)
        .terms.select('*', 'localProperties')
        .using(DefaultCaching)
        .all(),
      this._sp.web.select('Language')()
    ])
    return terms.map((term) => new DocumentTypeModel(term, termSetId, web.Language))
  }

  /**
   * Get current phase name for the project.
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
   */
  public async updateChecklistItem(listName: string, id: number, properties: Record<string, any>) {
    return await this.web.lists.getByTitle(listName).items.getById(id).update(properties)
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    // Outside a page (the integration tests in Node) PnPjs keeps its cache in memory instead.
    if (typeof sessionStorage === 'undefined') return
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
