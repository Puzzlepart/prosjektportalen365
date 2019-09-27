import { sp, SPRest, Web, SPConfiguration } from '@pnp/sp';
import '@pnp/polyfill-ie11';
import { HubConfigurationService } from '../../services';
import { SpEntityPortalService } from 'sp-entityportal-service';
import { ISPDataAdapterBaseSettings } from './ISPDataAdapterBaseSettings';

export class SPDataAdapterBase<T extends ISPDataAdapterBaseSettings> {
    public spConfiguration: SPConfiguration = {
        defaultCachingStore: 'session',
        defaultCachingTimeoutSeconds: 90,
        enableCacheExpiration: true,
        cacheExpirationIntervalMilliseconds: 2500,
        globalCacheDisable: false,
    };
    public settings: T;
    public hubConfigurationService: HubConfigurationService;
    public spEntityPortalService: SpEntityPortalService;
    public sp: SPRest;

    /**
     * Configure the SP data adapter
     * 
     * @param {ApplicationCustomizerContext | ListViewCommandSetContext} spfxContext Context
     * @param {T} settings Settings
     */
    public configure(spfxContext: any, settings: T) {
        this.settings = settings;
        sp.setup({ spfxContext, ...this.spConfiguration });
        this.sp = sp;
        this.hubConfigurationService = new HubConfigurationService(new Web(this.settings.hubSiteUrl));
        this.spEntityPortalService = new SpEntityPortalService({
            portalUrl: this.settings.hubSiteUrl,
            listName: 'Prosjekter',
            contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
            identityFieldName: 'GtSiteId',
            urlFieldName: 'GtSiteUrl',
        });
    }
}

export { ISPDataAdapterBaseSettings };