import { dateAdd, PnPClientStorage, PnPClientStore } from '@pnp/common'
import { LogLevel, PnPLogging } from '@pnp/logging'
import { spfi, SPFI, SPFx } from '@pnp/sp'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import { makeUrlAbsolute } from '../../helpers/makeUrlAbsolute'
import { ISPList } from '../../interfaces/ISPList'
import {
  ProjectPhaseChecklistData,
  ProjectPhaseModel
} from '../../models'
import { tryParseJson } from '../../util/tryParseJson'
import { IGetPropertiesData } from './types'
import { IProjectDataServiceConfiguration } from './IProjectDataServiceConfiguration'
import { IPropertyItemContext } from './IPropertyItemContext'

export class ProjectDataService {
  private _storage: PnPClientStore
  private _storageKeys: Record<string, string> = {
    _getPropertyItemContext: '{0}_propertyitemcontext',
    getPhases: '{0}_projectphases_terms'
  }
  public sp: SPFI

  /**
   * Creates a new instance of ProjectDataService
   *
   * @param configuration Configuration for ProjectDataService
   */
  constructor(
    public configuration: IProjectDataServiceConfiguration
  ) {
    this._initStorage()
    this.sp = spfi(this.configuration.webUrl).using(SPFx(this.configuration.spfxContext)).using(PnPLogging(LogLevel.Warning))
  }

  /**
   * Initialize storage
   */
  private _initStorage() {
    this._storage = new PnPClientStorage().session
    this._storageKeys = Object.keys(this._storageKeys).reduce((obj, key) => {
      obj[key] = format(this._storageKeys[key], this.configuration.siteId.replace(/-/g, ''))
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
   * Get property item context from site
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
          const [list] = await this.sp.web.lists
            .filter(`Title eq '${this.configuration.propertiesListName}'`)
            .select('Id', 'DefaultEditFormUrl')
            <ISPList[]>()
          if (!list)      return null
          const [item] = await this.sp.web.lists
            .getById(list.Id)
            .items.select('Id')
            .top(1)
            <{ Id: number }[]>()
          if (!item)    return null
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
      list: this.sp.web.lists.getById(context.listId),
      item: this.sp.web.lists.getById(context.listId).items.getById(context.itemId)
    }
  }

  /**
   * Get property item from site
   *
   * @param urlSource Url source
   */
  private async _getPropertyItem(
    urlSource: string = document.location.href
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
          .filter("substringof('Gt', InternalName)")(),
        this.sp.web.rootFolder.select('welcomepage')()
      ])

      urlSource = !urlSource.includes(welcomepage.WelcomePage)
        ? urlSource .replace('#syncproperties=1', `/${welcomepage.WelcomePage}#syncproperties=1`)
            .replace('//SitePages', '/SitePages')
        : urlSource

      const editFormUrl = makeUrlAbsolute( `${propertyItemContext.defaultEditFormUrl}?ID=${
          propertyItemContext.itemId }&Source=${encodeURIComponent(urlSource)}`
      )
      const versionHistoryUrl = `${this.configuration.webUrl}/_layouts/15/versions.aspx?list=${propertyItemContext.listId}&ID=${propertyItemContext.itemId}`
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
    const propertyItem = await this._getPropertyItem( `${document.location.protocol}//${document.location.hostname}${document.location.pathname}#syncproperties=1`
    )
    if (propertyItem) {
      const templateParameters = tryParseJson(propertyItem.fieldValuesText.TemplateParameters, {})
      return {
        ...propertyItem,
        propertiesListId: propertyItem.propertiesListId,
        templateParameters
      }
    } else {
      const entity = await this.configuration.entityService.fetchEntity(this.configuration.siteId, this.configuration.webUrl)
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
    const { Modified } = await this.sp.web.lists
      .getById(data.propertiesListId)
      .items.getById(data.fieldValues.Id)
      .select('Modified')
      <{ Modified: string }>()
    return (new Date().getTime() - new Date(Modified).getTime()) / 1000
  }

  /**
   * Update phase
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
        await this.configuration.entityService.updateEntityItem(this.configuration.siteId, properties)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Get phases
   *
   * @param termSetId Get phases
   * @param checklistData Checklist data
   */
  public async getPhases(
    termSetId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    checklistData: { [termGuid: string]: ProjectPhaseChecklistData } = {}
  ): Promise<ProjectPhaseModel[]> {
    return await Promise.all([])
    // const terms = await this._params.taxonomy
    //   .getDefaultSiteCollectionTermStore()
    //   .getTermSetById(termSetId)
    //   .terms.select('Id', 'Name', 'LocalCustomProperties')
    //   .usingCaching({
    //     key: this._storageKeys.getPhases,
    //     storeName: 'session',
    //     expiration: dateAdd(new Date(), 'day', 1)
    //   })
    //   .get()
    // Logger.write(`(ProjectDataService) Retrieved ${terms.length} phases from ${termSetId}.`)
    // return terms.map(
    //   (term) =>
    //     new ProjectPhaseModel(
    //       term.Name,
    //       term.Id,
    //       checklistData[term.Id],
    //       term.LocalCustomProperties
    //     )
    // )
  }

  /**
   * Get current phase
   *
   * @param phaseField Phase field
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
   * @param listName List name
   */
  public async getChecklistData(
    listName: string
  ): Promise<{ [termGuid: string]: ProjectPhaseChecklistData }> {
    try {
      const items = await this.sp.web.lists
        .getByTitle(listName)
        .items.select('ID', 'Title', 'GtComment', 'GtChecklistStatus', 'GtProjectPhase')
       ()
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
   * @param listName List name
   * @param id Id
   * @param properties Properties
   */
  public async updateChecklistItem(listName: string, id: number, properties: Record<string, any>) {
    return await this.sp.web.lists.getByTitle(listName).items.getById(id).update(properties)
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    Object.keys(this._storageKeys).forEach((name) => {
      const key = this.getStorageKey(name)
      sessionStorage.removeItem(key)
    })
  }
}

export { IGetPropertiesData }
