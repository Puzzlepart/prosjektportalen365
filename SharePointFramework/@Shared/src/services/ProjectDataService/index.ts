import { dateAdd, TypedHash, PnPClientStorage, PnPClientStore } from '@pnp/common'
import { ConsoleListener, Logger } from '@pnp/logging'
import { SPConfiguration } from '@pnp/sp'
import { makeUrlAbsolute } from '../../helpers/makeUrlAbsolute'
import { ISPList } from '../../interfaces/ISPList'
import {
  IProjectPhaseChecklistItem,
  ProjectPhaseChecklistData,
  ProjectPhaseModel
} from '../../models'
import { IGetPropertiesData } from './IGetPropertiesData'
import * as formatString from 'string-format'
import { IProjectDataServiceParams } from './IProjectDataServiceParams'
import { IPropertyItemContext } from './IPropertyItemContext'

export class ProjectDataService {
  public spConfiguration: SPConfiguration
  private _storage: PnPClientStore
  private _storageKeys: TypedHash<string> = {
    _getPropertyItemContext: '{0}_propertyitemcontext',
    getPhases: 'projectphases_terms'
  }

  /**
   * Creates a new instance of ProjectDataService
   *
   * @param {IProjectDataServiceParams} _params Parameters
   */
  constructor(private _params: IProjectDataServiceParams) {
    this._initStorage()
    if (_params.logLevel) {
      Logger.subscribe(new ConsoleListener())
      Logger.activeLogLevel = _params.logLevel
    }
  }

  /**
   * Initialize storage
   */
  private _initStorage() {
    this._storage = new PnPClientStorage().session
    this._storageKeys = Object.keys(this._storageKeys).reduce((obj, key) => {
      obj[key] = formatString(this._storageKeys[key], this._params.siteId.replace(/-/g, ''))
      return obj
    }, {})
    this._storage.deleteExpired()
  }

  /**
   * Get storage key for function
   *
   * @param {string} func Function name
   */
  private _getStorageKey(func: string) {
    return this._storageKeys[func]
  }

  /**
   * Get property item context from site
   *
   * @param {Date} expire Date of expire for cache
   */
  private async _getPropertyItemContext(
    expire: Date = dateAdd(new Date(), 'minute', 15)
  ): Promise<IPropertyItemContext> {
    const context: Partial<IPropertyItemContext> = await this._storage.getOrPut(
      this._getStorageKey('_getPropertyItemContext'),
      async () => {
        try {
          Logger.write(
            `(ProjectDataService) (_getPropertyItemContext) Checking if list ${this._params.propertiesListName} exists in web.`
          )
          const [list] = await this._params.sp.web.lists
            .filter(`Title eq '${this._params.propertiesListName}'`)
            .select('Id', 'DefaultEditFormUrl')
            .usingCaching()
            .get<ISPList[]>()
          if (!list) {
            Logger.write(
              `(ProjectDataService) List ${this._params.propertiesListName} does not exist in web.`
            )
            return null
          }
          Logger.write(
            `(ProjectDataService) (_getPropertyItemContext) Checking if there's a entry in list ${this._params.propertiesListName}.`
          )
          const [item] = await this._params.sp.web.lists
            .getById(list.Id)
            .items.select('Id')
            .top(1)
            .usingCaching()
            .get<{ Id: number }[]>()
          if (!item) {
            Logger.write(
              `(ProjectDataService) (_getPropertyItemContext) No entry found in list ${this._params.propertiesListName}.`
            )
            return null
          }
          Logger.write(
            `(ProjectDataService) (_getPropertyItemContext) Entry with ID ${item.Id} found in list ${this._params.propertiesListName}.`
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
    return {
      ...context,
      list: this._params.sp.web.lists.getById(context.listId),
      item: this._params.sp.web.lists.getById(context.listId).items.getById(context.itemId)
    }
  }

  /**
   * Get property item from site
   *
   * @param {string} urlSource Url source
   */
  private async _getPropertyItem(
    urlSource: string = encodeURIComponent(document.location.href)
  ): Promise<IGetPropertiesData> {
    try {
      const propertyItemContext = await this._getPropertyItemContext()
      if (!propertyItemContext) return null
      const [fieldValuesText, fieldValues, fields] = await Promise.all([
        propertyItemContext.item.fieldValuesAsText.get(),
        propertyItemContext.item.get(),
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
          .filter("substringof('Gt', InternalName)")
          .usingCaching()
          .get()
      ])
      const editFormUrl = makeUrlAbsolute(
        `${propertyItemContext.defaultEditFormUrl}?ID=${propertyItemContext.itemId}&Source=${urlSource}`
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
      encodeURIComponent(
        `${document.location.protocol}//${document.location.hostname}${document.location.pathname}#syncproperties=1`
      )
    )
    // tslint:disable-next-line: early-exit
    if (propertyItem) {
      let templateParameters: TypedHash<any>
      try {
        templateParameters = JSON.parse(propertyItem.fieldValues.TemplateParameters) || {}
      } catch {
        templateParameters = {}
      }
      Logger.write('(ProjectDataService) (getPropertiesData) Local property item found.')
      return {
        ...propertyItem,
        propertiesListId: propertyItem.propertiesListId,
        templateParameters
      }
    } else {
      Logger.write(
        '(ProjectDataService) (getPropertiesData) Local property item not found. Retrieving data from portal site.'
      )
      const entity = await this._params.entityService
        .configure(this.spConfiguration)
        .fetchEntity(this._params.siteId, this._params.webUrl)
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
   * @param {IGetPropertiesData} data Data
   */
  public async getPropertiesLastUpdated(data: IGetPropertiesData): Promise<number> {
    // tslint:disable-next-line: naming-convention
    const { Modified } = await this._params.sp.web.lists
      .getById(data.propertiesListId)
      .items.getById(data.fieldValues.Id)
      .select('Modified')
      .get<{ Modified: string }>()
    return (new Date().getTime() - new Date(Modified).getTime()) / 1000
  }

  /**
   * Update phase
   *
   * @param {Phase} phase Phase
   * @param {string} phaseTextField Phase text field
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
   * Get phases
   *
   * @param {string} termSetId Get phases
   * @param {ChecklistData} checklistData Checklist data
   */
  public async getPhases(
    termSetId: string,
    checklistData: { [termGuid: string]: ProjectPhaseChecklistData } = {}
  ): Promise<ProjectPhaseModel[]> {
    const terms = await this._params.taxonomy
      .getDefaultSiteCollectionTermStore()
      .getTermSetById(termSetId)
      .terms.select('Id', 'Name', 'LocalCustomProperties')
      .usingCaching({
        key: this._storageKeys.getPhases,
        storeName: 'session',
        expiration: dateAdd(new Date(), 'day', 1)
      })
      .get()
    Logger.write(`(ProjectDataService) Retrieved ${terms.length} phases from ${termSetId}.`)
    return terms.map(
      (term) =>
        new ProjectPhaseModel(
          term.Name,
          term.Id,
          checklistData[term.Id],
          term.LocalCustomProperties
        )
    )
  }

  /**
   * Get current phase
   *
   * @param {string} phaseField Phase field
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
   * Get checklist data
   *
   * @param {string} listName List name
   */
  public async getChecklistData(
    listName: string
  ): Promise<{ [termGuid: string]: ProjectPhaseChecklistData }> {
    try {
      const items = await this._params.sp.web.lists
        .getByTitle(listName)
        .items.select('ID', 'Title', 'GtComment', 'GtChecklistStatus', 'GtProjectPhase')
        .get<IProjectPhaseChecklistItem[]>()
      const checklistData = items
        .filter((item) => item.GtProjectPhase)
        .reduce((obj, item) => {
          const status = item.GtChecklistStatus.toLowerCase()
          const termId = `/Guid(${item.GtProjectPhase.TermGuid})/`
          obj[termId] = obj[termId] ? obj[termId] : {}
          obj[termId].stats = obj[termId].stats || {}
          obj[termId].items = obj[termId].items || []
          obj[termId].items.push(item)
          obj[termId].stats[status] = obj[termId].stats[status] ? obj[termId].stats[status] + 1 : 1
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
   * @param {string} listName List name
   * @param {number} id Id
   * @param {TypedHash} properties Properties
   */
  public async updateChecklistItem(listName: string, id: number, properties: TypedHash<any>) {
    return await this._params.sp.web.lists.getByTitle(listName).items.getById(id).update(properties)
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    Object.keys(this._storageKeys).forEach((name) => {
      const key = this._getStorageKey(name)
      Logger.write(`(ProjectDataService) Clearing key ${key} from sessionStorage.`)
      sessionStorage.removeItem(key)
    })
  }
}

export { IGetPropertiesData }
