import { format } from '@fluentui/react'
import { AssignFrom, IPnPClientStore, PnPClientStorage, dateAdd, getHashCode } from '@pnp/core'
import { ConsoleListener, Logger } from '@pnp/logging'
import { Caching } from '@pnp/queryable'
import '@pnp/sp/presets/all'
import { IWeb, SPFI, spfi } from '@pnp/sp/presets/all'
import { createSpfiInstance } from '../../data'
import { ISPList } from '../../interfaces/ISPList'
import { ChecklistItemModel, ProjectPhaseChecklistData, ProjectPhaseModel } from '../../models'
import { makeUrlAbsolute } from '../../util/makeUrlAbsolute'
import { tryParseJson } from '../../util/tryParseJson'
import { IGetPropertiesData } from './IGetPropertiesData'
import { IProjectDataServiceParams } from './IProjectDataServiceParams'
import { IPropertyItemContext } from './IPropertyItemContext'

/**
 * Default caching configuration for `ProjectDataService`.
 *
 * - `store`: `local`
 * - `keyFactory`: Hash code of the URL
 * - `expireFunc`: 60 minutes from now
 */
const DefaultCaching = Caching({
  store: 'local',
  keyFactory: (url) => getHashCode(url.toLowerCase()).toString(),
  expireFunc: () => dateAdd(new Date(), 'minute', 60)
})

export class ProjectDataService {
  private _storage: IPnPClientStore
  private _storageKeys: Record<string, string> = {
    _getPropertyItemContext: '{0}_propertyitemcontext',
    getPhases: '{0}_projectphases_terms'
  }
  private _sp: SPFI
  public web: IWeb

  /**
   * Creates a new instance of `ProjectDataService`. Initialize the storage and logger,
   * aswell as configuring the SPFx context and setting the web from `params.webUrl`.
   *
   * @param _params - Parameters
   */
  constructor(private _params: IProjectDataServiceParams) {
    this._initStorage()
    if (_params.logLevel) {
      Logger.subscribe(ConsoleListener())
      Logger.activeLogLevel = _params.logLevel
    }
    this._sp = createSpfiInstance(this._params.spfxContext)
    this.web = spfi(_params.webUrl).using(AssignFrom(this._sp.web)).web
  }

  /**
   * Initialize storage
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
   * Get property item context from site.
   *
   * @param expire Date of expire for cache
   */
  private async _getPropertyItemContext(
    expire: Date = dateAdd(new Date(), 'minute', 15)
  ): Promise<IPropertyItemContext> {
    const context: Partial<IPropertyItemContext> = await this._storage.getOrPut(
      this.getStorageKey('_getPropertyItemContext'),
      async () => {
        try {
          this._logInfo(`Checking if list ${this._params.propertiesListName} exists in web.`, '_getPropertyItemContext')
          const [list] = await this.web.lists
            .filter(`Title eq '${this._params.propertiesListName}'`)
            .select('Id', 'DefaultEditFormUrl')<ISPList[]>()
          if (!list) {
            this._logInfo(`List ${this._params.propertiesListName} does not exist in web.`, '_getPropertyItemContext')
            return null
          }
          this._logInfo(`Checking if there's a entry in list ${this._params.propertiesListName}.`, '_getPropertyItemContext')
          const [item] = await this.web.lists.getById(list.Id).items.select('Id').top(1)<
            { Id: number }[]
          >()
          if (!item) {
            this._logInfo(`No entry found in list ${this._params.propertiesListName}.`, '_getPropertyItemContext')
            return null
          }
          this._logInfo(`Entry with ID ${item.Id} found in list ${this._params.propertiesListName}.`, '_getPropertyItemContext')
          return {
            itemId: item.Id,
            listId: list.Id,
            defaultEditFormUrl: list.DefaultEditFormUrl
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(error)
          return null
        }
      },
      expire
    )
    const list = this.web.lists.getById(context.listId)
    const item = list.items.getById(context.itemId)
    return {
      ...context,
      list,
      item
    } as IPropertyItemContext
  }

  /**
   * Get project properties for the site/web. 
   * 
   * Returns the following properties:
   * - `fieldValuesText`: Field values in text format
   * - `fieldValues`: Field values in object format
   * - `fields`: All fields in the list
   * - `editFormUrl`: Edit form URL including generated source URL
   * - `versionHistoryUrl`: Version history URL
   * - `propertiesListId`: List ID of the properties list
   * 
   * Returns null if no properties are found.
   *
   * @param sourceUrl Source url to append to edit form url
   */
  private async _getPropertyItem(
    sourceUrl: string = document.location.href
  ): Promise<IGetPropertiesData> {
    try {
      const propertyItemContext = await this._getPropertyItemContext()
      if (!propertyItemContext) return null
      const [fieldValuesText, fieldValues, fields, welcomepage] = await Promise.all([
        propertyItemContext.item.fieldValuesAsText(),
        propertyItemContext.item(),
        propertyItemContext.list.fields
          .select(
            'Id',
            'InternalName',
            'Title',
            'Description',
            'TypeAsString',
            'SchemaXml',
            'TextField'
          )
          // eslint-disable-next-line quotes
          .filter("substringof('Gt', InternalName)")
          .using(DefaultCaching)(),
        this.getWelcomePage()
      ])

      const modifiedSourceUrl = !sourceUrl.includes(welcomepage)
        ? sourceUrl
          .replace('#syncproperties=1', `/${welcomepage}#syncproperties=1`)
          .replace('//SitePages', '/SitePages')
        : sourceUrl

      const editFormUrl = makeUrlAbsolute(
        `${propertyItemContext.defaultEditFormUrl}?ID=${propertyItemContext.itemId
        }&Source=${encodeURIComponent(modifiedSourceUrl)}`
      )

      const versionHistoryUrl = `${this._params.webUrl}/_layouts/15/versions.aspx?list=${propertyItemContext.listId}&ID=${propertyItemContext.itemId}`
      return {
        fieldValuesText,
        fieldValues,
        editFormUrl,
        versionHistoryUrl,
        fields,
        propertiesListId: propertyItemContext.listId
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Get properties data
   */
  public async getPropertiesData(): Promise<IGetPropertiesData> {
    const propertyItem = await this._getPropertyItem(
      `${document.location.protocol}//${document.location.hostname}${document.location.pathname}#syncproperties=1`
    )
    if (propertyItem) {
      const templateParameters = tryParseJson(propertyItem.fieldValuesText.TemplateParameters, {})
      this._logInfo('Local property item found.', 'getPropertiesData')
      return {
        ...propertyItem,
        propertiesListId: propertyItem.propertiesListId,
        templateParameters
      }
    } else {
      this._logInfo('Local property item not found. Retrieving data from portal site.', 'getPropertiesData')
      const entity = await this._params.entityService.fetchEntity(this._params.siteId, this._params.webUrl)
      return {
        fieldValues: entity.fieldValues,
        fieldValuesText: entity.fieldValues,
        fields: entity.fields,
        ...entity.urls,
        propertiesListId: null,
        templateParameters: {}
      }
    }
  }

  /**
   * Get last updated time in seconds since now
   *
   * @param data Data
   */
  public async getPropertiesLastUpdated(data: IGetPropertiesData): Promise<number> {
    const { Modified } = await this.web.lists
      .getById(data.propertiesListId)
      .items.getById(data.fieldValues.Id)
      .select('Modified')<{ Modified: string }>()
    return (new Date().getTime() - new Date(Modified).getTime()) / 1000
  }

  /**
   * Update phase to the specified `phase` for the project.
   *
   * @param phase Phase
   * @param phaseTextField Phase text field
   */
  public async updatePhase(phase: ProjectPhaseModel, phaseTextField: string): Promise<void> {
    const properties = { [phaseTextField]: phase.toString() }
    try {
      const propertyItemContext = await this._getPropertyItemContext()
      if (propertyItemContext) {
        await propertyItemContext.item.update(properties)
      } else {
        await this._params.entityService.updateEntityItem(this._params.siteId, properties)
      }
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
    const terms = await this._sp.termStore
      .sets
      .getById(termSetId)
      .terms
      .select('*', 'localProperties')
      .using(DefaultCaching)()
    // eslint-disable-next-line no-console
    console.log(termSetId, terms)
    return terms.map((term) => new ProjectPhaseModel(term, termSetId, checklistData[term.id]))
  }

  /**
   * Get current phase name for the project.
   *
   * @param phaseField Phase field name
   */
  public async getCurrentPhaseName(phaseField: string): Promise<string> {
    try {
      const propertiesData = await this.getPropertiesData()
      return propertiesData.fieldValuesText[phaseField]
    } catch (error) {
      throw new Error()
    }
  }

  /**
   * Get checklist data from the specified list as an object.
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
      const items = await this.web.lists
        .getByTitle(listName)
        .items.select('ID', 'Title', 'GtComment', 'GtChecklistStatus', 'GtProjectPhase')<
          Record<string, any>[]
        >()
      const checklistItems = items.map((item) => new ChecklistItemModel(item))
      const checklistData = checklistItems
        .filter((item) => item.termGuid)
        .reduce((obj, item) => {
          obj[item.termGuid] = obj[item.termGuid] ? obj[item.termGuid] : {}
          obj[item.termGuid].stats = obj[item.termGuid].stats || {}
          obj[item.termGuid].items = obj[item.termGuid].items || []
          obj[item.termGuid].items.push(item)
          obj[item.termGuid].stats[item.status] = obj[item.termGuid].stats[item.status]
            ? obj[item.termGuid].stats[item.status] + 1
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

export { IGetPropertiesData }
