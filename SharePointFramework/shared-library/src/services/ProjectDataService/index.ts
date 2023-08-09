import { format } from '@fluentui/react'
import { AssignFrom, IPnPClientStore, PnPClientStorage, dateAdd } from '@pnp/core'
import { ConsoleListener, Logger } from '@pnp/logging'
import '@pnp/sp/presets/all'
import { IWeb, SPFI, spfi } from '@pnp/sp/presets/all'
import { DefaultCaching, createSpfiInstance } from '../../data'
import { ISPList } from '../../interfaces/ISPList'
import { ChecklistItemModel, ProjectPhaseChecklistData, ProjectPhaseModel } from '../../models'
import { makeUrlAbsolute } from '../../util/makeUrlAbsolute'
import { tryParseJson } from '../../util/tryParseJson'
import { IGetPropertiesData } from './IGetPropertiesData'
import { IProjectDataServiceParams } from './IProjectDataServiceParams'
import { IPropertyItemContext } from './IPropertyItemContext'

export class ProjectDataService {
  private _storage: IPnPClientStore
  private _storageKeys: Record<string, string> = {
    _getPropertyItemContext: '{0}_propertyitemcontext'
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
   * Get property item context from site. Stores the context in session storage
   * for 15 minutes.
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
          this._logInfo(
            `Checking if list ${this._params.propertiesListName} exists in web.`,
            '_getPropertyItemContext'
          )
          const [list] = await this.web.lists
            .filter(`Title eq '${this._params.propertiesListName}'`)
            .select('Id', 'DefaultEditFormUrl')<ISPList[]>()
          if (!list) {
            this._logInfo(
              `List ${this._params.propertiesListName} does not exist in web.`,
              '_getPropertyItemContext'
            )
            return null
          }
          this._logInfo(
            `Checking if there's a entry in list ${this._params.propertiesListName}.`,
            '_getPropertyItemContext'
          )
          const [item] = await this.web.lists.getById(list.Id).items.select('Id').top(1)<
            { Id: number }[]
          >()
          if (!item) {
            this._logInfo(
              `No entry found in list ${this._params.propertiesListName}.`,
              '_getPropertyItemContext'
            )
            return null
          }
          this._logInfo(
            `Entry with ID ${item.Id} found in list ${this._params.propertiesListName}.`,
            '_getPropertyItemContext'
          )
          return {
            itemId: item.Id,
            listId: list.Id,
            defaultEditFormUrl: list.DefaultEditFormUrl
          }
        } catch (error) {
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
   * Mapping fields to include `ShowInEditForm`, `ShowInNewForm` and `ShowInDisplayForm`.
   *
   * @param fields Fields to map
   */
  private _mapFields(fields: any[]): any {
    return fields.map((fld) => ({
      ...fld,
      ShowInEditForm: fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') === -1,
      ShowInNewForm: fld.SchemaXml.indexOf('ShowInNewForm="FALSE"') === -1,
      ShowInDisplayForm: fld.SchemaXml.indexOf('ShowInDisplayForm="FALSE"') === -1
    }))
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
   * @remarks The queries `ctx.item.fieldValuesAsText()` and `ctx.item()` needs to be run
   * separately, as expanding `ctx.item()` with `FieldValuesAsText` will result in
   * corrupt data.
   *
   * @param sourceUrl Source url to append to edit form url
   */
  private async _getPropertyItem(
    sourceUrl: string = document.location.href
  ): Promise<IGetPropertiesData> {
    try {
      const ctx = await this._getPropertyItemContext()
      if (!ctx) return null
      const fields = await ctx.list.fields
        .select(
          'Id',
          'InternalName',
          'Title',
          'Description',
          'TypeAsString',
          'SchemaXml',
          'TextField',
          'Choices',
          'Hidden',
          'TermSetId'
        )
        // eslint-disable-next-line quotes
        .filter("substringof('Gt', InternalName)")
        .using(DefaultCaching)()
      const userFields = fields.filter((fld) => fld.TypeAsString.indexOf('User') === 0)
      const [fieldValuesText, fieldValues, welcomePageUrl] = await Promise.all([
        ctx.item.fieldValuesAsText(),
        ctx.item
          .select(
            '*',
            ...userFields.map(({ InternalName }) => `${InternalName}/Id`),
            ...userFields.map(({ InternalName }) => `${InternalName}/Title`),
            ...userFields.map(({ InternalName }) => `${InternalName}/EMail`)
          )
          .expand(...userFields.map((fld) => fld.InternalName))(),
        this.getWelcomePage()
      ])

      const propertiesData: IGetPropertiesData = {
        fieldValuesText,
        fieldValues,
        fields: this._mapFields(fields),
        versionHistoryUrl: '{0}/_layouts/15/versions.aspx?list={1}&ID={2}',
        propertiesListId: ctx.listId
      }

      const modifiedSourceUrl = !sourceUrl.includes(welcomePageUrl)
        ? sourceUrl
            .replace('#syncproperties=1', `/${welcomePageUrl}#syncproperties=1`)
            .replace('//SitePages', '/SitePages')
        : sourceUrl
      propertiesData.editFormUrl = makeUrlAbsolute(
        `${ctx.defaultEditFormUrl}?ID=${ctx.itemId}&Source=${encodeURIComponent(modifiedSourceUrl)}`
      )
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
   * Get properties data for the site/web.
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
      } as IGetPropertiesData
    } else {
      this._logInfo(
        'Local property item not found. Retrieving data from portal site.',
        'getPropertiesData'
      )
      const entity = await this._params.entityService.fetchEntity(
        this._params.siteId,
        this._params.webUrl
      )
      return {
        fieldValues: entity.fieldValues,
        fieldValuesText: entity.fieldValues,
        fields: entity.fields,
        ...entity.urls,
        propertiesListId: null,
        templateParameters: {}
      } as IGetPropertiesData
    }
  }

  /**
   * Get last updated time in seconds since now.
   *
   * @param data Data from `getPropertiesData`
   */
  public async getPropertiesLastUpdated(data: IGetPropertiesData): Promise<number> {
    const { Modified } = await this.web.lists
      .getById(data.propertiesListId)
      .items.getById(data.fieldValues.Id)
      .select('Modified')<{ Modified: string }>()
    return (new Date().getTime() - new Date(Modified).getTime()) / 1000
  }

  /**
   * Update phase to the specified `phase` for the project. Updates the local property item, with
   * fallback to updating the entity item if the local property item is not found.
   *
   * @param phase Phase
   * @param phaseTextField Phase text field
   */
  public async updateProjectPhase(phase: ProjectPhaseModel, phaseTextField: string): Promise<void> {
    const properties = { [phaseTextField]: phase.toString() }
    try {
      const propertyItemContext = await this._getPropertyItemContext()
      if (propertyItemContext) await propertyItemContext.item.update(properties)
      await this._params.entityService.updateEntityItem(this._params.siteId, properties)
    } catch (error) {
      throw error
    }
  }

  /**
   * Update properties for the project using the local property list.
   *
   * @param properties Properties to update
   */
  public async updateProjectProperties(properties: { [key: string]: string }): Promise<void> {
    try {
      const propertyItemContext = await this._getPropertyItemContext()
      // eslint-disable-next-line no-console
      console.log(propertyItemContext, properties)
      if (propertyItemContext){
        const updateResult = await propertyItemContext.item.update(properties)
        // eslint-disable-next-line no-console
        console.log(updateResult)
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
    const terms = await this._sp.termStore.sets
      .getById(termSetId)
      .terms.select('*', 'localProperties')
      .using(DefaultCaching)()
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
