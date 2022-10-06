import '@pnp/polyfill-ie11'
import { sp, SPConfiguration, SPRest, Web } from '@pnp/sp'
import { SpEntityPortalService } from 'sp-entityportal-service'
import { PortalDataService } from '../../services/PortalDataService'
import { ISPDataAdapterBaseConfiguration } from './ISPDataAdapterBaseConfiguration'
import { WebPartContext } from '@microsoft/sp-webpart-base'
import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'

export class SPDataAdapterBase<T extends ISPDataAdapterBaseConfiguration> {
  public spConfiguration: SPConfiguration = {
    defaultCachingStore: 'session',
    defaultCachingTimeoutSeconds: 90,
    enableCacheExpiration: true,
    cacheExpirationIntervalMilliseconds: 2500,
    globalCacheDisable: false
  }
  public settings: T
  public portal: PortalDataService
  public entityService: SpEntityPortalService
  public sp: SPRest
  public isConfigured: boolean = false
  public spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext | WebPartContext

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext Context
   * @param settings Settings
   */
  public configure(spfxContext: any, settings: T) {
    this.spfxContext = spfxContext
    this.settings = settings
    sp.setup({ spfxContext, ...this.spConfiguration })
    this.sp = sp
    this.portal = new PortalDataService().configure({
      urlOrWeb: new Web(this.settings.hubSiteUrl),
      siteId: this.settings.siteId
    })
    this.entityService = new SpEntityPortalService({
      portalUrl: this.settings.hubSiteUrl,
      listName: 'Prosjekter',
      contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
      identityFieldName: 'GtSiteId',
      urlFieldName: 'GtSiteUrl'
    })
    this.isConfigured = true
  }
}

export { ISPDataAdapterBaseConfiguration }
