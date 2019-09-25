import { sp, SPConfiguration, Web } from '@pnp/sp';
import * as strings from 'ProjectExtensionsStrings';
import { HubConfigurationService, ProjectDataService } from 'shared/lib/services';
import { SpEntityPortalService } from 'sp-entityportal-service';
import { TemplateFile } from '../models';

export interface ISPDataAdapterSettings {
    siteId: string;
    webUrl: string;
    hubSiteUrl: string;
}


export default new class SPDataAdapter {
    public spConfiguration: SPConfiguration = {
        defaultCachingStore: 'session',
        defaultCachingTimeoutSeconds: 90,
        enableCacheExpiration: true,
        cacheExpirationIntervalMilliseconds: 2500,
        globalCacheDisable: false,
    };
    public project: ProjectDataService;
    private _settings: ISPDataAdapterSettings;
    private _hubConfigurationService: HubConfigurationService;
    private _spEntityPortalService: SpEntityPortalService;

    /**
     * Configure the SP data adapter
     * 
     * @param settings 
     */
    public configure(settings: ISPDataAdapterSettings) {
        this._settings = settings;
        sp.setup(this.spConfiguration);
        this._hubConfigurationService = new HubConfigurationService(new Web(this._settings.hubSiteUrl));
        this._spEntityPortalService = new SpEntityPortalService({
            webUrl: this._settings.hubSiteUrl,
            listName: 'Prosjekter',
            contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
            identityFieldName: 'GtSiteId'
        });
        this.project = new ProjectDataService({
            ...this._settings,
            spEntityPortalService: this._spEntityPortalService,
            propertiesListName: strings.ProjectPropertiesListName,
        });
    }

    /**
     * Get document templates
     * 
     * @param {string} templateLibrary Template library
     */
    public async getDocumentTemplates(templateLibrary: string = 'Malbibliotek') {
        const currentPhase = await this.project.getCurrentPhaseName();
        return await this._hubConfigurationService.getHubItems(
            templateLibrary,
            TemplateFile,
            {
                ViewXml: `<View><Query><Where><Or><Or><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${currentPhase}</Value></Eq><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>Flere faser</Value></Eq></Or><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>Ingen fase</Value></Eq></Or></Where></Query></View>`
            },
            ['File'],
        );
    }

    /**
     * Get libraries in web
     */
    public async getLibraries() {
        return (
            await sp.web.lists
                .select('Id', 'Title', 'RootFolder/ServerRelativeUrl')
                .expand('RootFolder')
                .filter(`BaseTemplate eq 101 and IsCatalog eq false and IsApplicationList eq false and ListItemEntityTypeFullName ne 'SP.Data.FormServerTemplatesItem'`)
                .usingCaching()
                .get()
        ).map(l => ({
            Id: l.Id,
            Title: l.Title,
            ServerRelativeUrl: l.RootFolder.ServerRelativeUrl,
        }));
    }
};