import { format } from '@fluentui/react'
import { AssignFrom, IPnPClientStore, PnPClientStorage, dateAdd } from '@pnp/core'
import { ConsoleListener, Logger } from '@pnp/logging'
import '@pnp/sp/presets/all'
import { IWeb, SPFI, spfi } from '@pnp/sp/presets/all'
import { DefaultCaching, createSpfiInstance } from '../../data'
import {
  ChecklistItemModel,
  ProjectPhaseChecklistData,
  ProjectPhaseModel,
  SPField
} from '../../models'
import { getClassProperties } from '../../util'
import { tryParseJson } from '../../util/tryParseJson'
import {
  ILocalProjectInformationItemContext,
  IProjectDataServiceParams,
  IProjectInformationData
} from './types'

export class ProjectDataService {
  private _storage: IPnPClientStore
  private _storageKeys: Record<string, string> = {
    _getLocalProjectInformationItemContext: '{0}_local_project_information_item_context'
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
   * Mapping fields to include `ShowInEditForm`, `ShowInNewForm` and `ShowInDisplayForm`
   * which is only present in `SchemaXml`, not as separate properties.
   *
   * @param fields Fields to map
   */
  private _mapFields(fields: SPField[]): SPField[] {
    return fields.map<SPField>((fld) => ({
      ...fld,
      ShowInEditForm: fld.SchemaXml.indexOf('ShowInEditForm="FALSE"') === -1,
      ShowInNewForm: fld.SchemaXml.indexOf('ShowInNewForm="FALSE"') === -1,
      ShowInDisplayForm: fld.SchemaXml.indexOf('ShowInDisplayForm="FALSE"') === -1
    }))
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
  private async _getLocalProjectInformationItem(): Promise<IProjectInformationData> {
    try {
      const ctx = await this._getLocalProjectInformationItemContext()
      if (!ctx) return null
      const fields = await ctx.list.fields
        .select(...getClassProperties(SPField))
        // eslint-disable-next-line quotes
        .filter("substringof('Gt', InternalName)")<SPField[]>()
      const userFields = fields.filter((fld) => fld.TypeAsString.indexOf('User') === 0)
      const [fieldValuesText, fieldValues] = await Promise.all([
        ctx.item.fieldValuesAsText(),
        ctx.item
          .select(
            '*',
            ...userFields.map(({ InternalName }) => `${InternalName}/Id`),
            ...userFields.map(({ InternalName }) => `${InternalName}/Title`),
            ...userFields.map(({ InternalName }) => `${InternalName}/EMail`)
          )
          .expand(...userFields.map((fld) => fld.InternalName))()
      ])

      const propertiesData: IProjectInformationData = {
        fieldValuesText,
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
    const item = await this._getLocalProjectInformationItem()
    if (item) {
      const templateParameters = tryParseJson(item.fieldValuesText.TemplateParameters, {})
      this._logInfo('Local property item found.', 'getPropertiesData')
      return {
        ...item,
        propertiesListId: item.propertiesListId,
        templateParameters
      } as IProjectInformationData
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
        propertiesListId: null,
        templateParameters: {},
        ...entity.urls
      } as IProjectInformationData
    }
  }

  /**
   * Get last updated time in seconds since now.
   *
   * @param data Data from `getPropertiesData`
   */
  public async getPropertiesLastUpdated(data: IProjectInformationData): Promise<number> {
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
      const propertyItemContext = await this._getLocalProjectInformationItemContext()
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
      const propertyItemContext = await this._getLocalProjectInformationItemContext()
      if (propertyItemContext) {
        await propertyItemContext.item.update(properties)
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
      const propertiesData = await this.getProjectInformationData()
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

export * from './types'
