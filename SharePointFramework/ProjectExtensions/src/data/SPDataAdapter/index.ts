import { ApplicationCustomizerContext } from '@microsoft/sp-application-base';
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility';
import { TemplateFile } from 'models/TemplateFile';
import * as strings from 'ProjectExtensionsStrings';
import {  SPDataAdapterBase } from 'shared/lib/data';
import { ProjectDataService } from 'shared/lib/services';
import * as validFilename from 'valid-filename';
import { ISPLibrary } from './ISPLibrary';
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration';

export default new class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
    public project: ProjectDataService;

    /**
     * Configure the SP data adapter
     * 
     * @param {ApplicationCustomizerContext | ListViewCommandSetContext} spfxContext Context
     * @param {ISPDataAdapterConfiguration} settings Settings
     */
    public configure(spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext, settings: ISPDataAdapterConfiguration) {
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
     * Checks if the filename is valid
     * 
     * @param {string} folderServerRelativeUrl Folder server relative URL
     * @param {string} name File name
     */
    public async isFilenameValid(folderServerRelativeUrl: string, name: string): Promise<string> {
        if (!validFilename(name)) {
            return strings.FilenameInValidErrorText;
        }
        let [file] = await this.sp.web.getFolderByServerRelativeUrl(folderServerRelativeUrl).files.filter(`Name eq '${name}'`).get();
        if (file) {
            return strings.FilenameAlreadyInUseErrorText;
        }
        return null;
    }

    /**
     * Get document templates
     * 
     * @param {string} templateLibrary Template library
     * @param {string} viewXml View xml
     */
    public async getDocumentTemplates(templateLibrary: string, viewXml?: string) {
        return await this.portalDataService.getHubItems(
            templateLibrary,
            TemplateFile,
            {
                ViewXml: viewXml || '<View></View>'
            },
            ['File', 'FieldValuesAsText'],
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