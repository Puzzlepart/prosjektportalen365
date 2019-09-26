import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility';
import { TemplateFile } from 'models/TemplateFile';
import * as strings from 'ProjectExtensionsStrings';
import { ISPDataAdapterBaseSettings, SPDataAdapterBase } from 'shared/lib/data';
import { ProjectDataService } from 'shared/lib/services';

export interface ISPDataAdapterSettings extends ISPDataAdapterBaseSettings { }

export interface ISPLibrary {
    Id: string;
    Title: string;
    ServerRelativeUrl: string;
}

export default new class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterSettings> {
    public project: ProjectDataService;

    /**
     * Configure the SP data adapter
     * 
     * @param {ApplicationCustomizerContext | ListViewCommandSetContext} spfxContext Context
     * @param {ISPDataAdapterSettings} settings Settings
     */
    public configure(spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext, settings: ISPDataAdapterSettings) {
        super.configure(spfxContext, settings);
        this.project = new ProjectDataService({
            ...this.settings,
            spEntityPortalService: this.spEntityPortalService,
            propertiesListName: strings.ProjectPropertiesListName,
            sp: this.sp,
        });
        this.project.spConfiguration = this.spConfiguration;
    }

    /**
     * Get document templates
     * 
     * @param {string} templateLibrary Template library
     */
    public async getDocumentTemplates(templateLibrary: string) {
        const currentPhase = await this.project.getCurrentPhaseName();
        return await this.hubConfigurationService.getHubItems(
            templateLibrary,
            TemplateFile,
            {
                ViewXml: `
                <View>
                    <Query>
                        <Where>
                            <Or>
                                <Or>
                                    <Eq>
                                        <FieldRef Name='GtProjectPhase' />
                                        <Value Type='Text'>${currentPhase}</Value>
                                    </Eq>
                                    <Eq>
                                        <FieldRef Name='GtProjectPhase' />
                                        <Value Type='Text'>Flere faser</Value>
                                    </Eq>
                                </Or>
                                <Eq>
                                    <FieldRef Name='GtProjectPhase' />
                                    <Value Type='Text'>Ingen fase</Value>
                                </Eq>
                            </Or>
                        </Where>
                    </Query>
                </View>
                `
            },
            ['File'],
        );
    }

    /**
     * Get libraries in web
     */
    public async getLibraries(): Promise<ISPLibrary[]> {
        return (
            await this.sp.web.lists
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