import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { TemplateItem } from 'models/TemplateItem'
import * as strings from 'ProjectExtensionsStrings'
import { SPDataAdapterBase } from 'pp365-shared/lib/data'
import { ProjectDataService } from 'pp365-shared/lib/services'
import * as validFilename from 'valid-filename'
import { ISPLibraryFolder } from './ISPLibraryFolder'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'

export default new (class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService

  /**
   * Configure the SP data adapter
   *
   * @param {ApplicationCustomizerContext | ListViewCommandSetContext} spfxContext Context
   * @param {ISPDataAdapterConfiguration} settings Settings
   */
  public configure(
    spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext,
    settings: ISPDataAdapterConfiguration
  ) {
    super.configure(spfxContext, settings)
    this.project = new ProjectDataService({
      ...this.settings,
      entityService: this.entityService,
      propertiesListName: strings.ProjectPropertiesListName,
      sp: this.sp
    })
    this.project.spConfiguration = this.spConfiguration
  }

  /**
   * Checks if the filename is valid
   *
   * @param {string} folderServerRelativeUrl Folder server relative URL
   * @param {string} name File name
   */
  public async isFilenameValid(folderServerRelativeUrl: string, name: string): Promise<string> {
    if (!validFilename(name)) return strings.FilenameInValidErrorText
    const [file] = await this.sp.web
      .getFolderByServerRelativeUrl(folderServerRelativeUrl)
      .files.filter(`Name eq '${name}'`)
      .get()
    if (file) {
      return strings.FilenameAlreadyInUseErrorText
    }
    return null
  }

  /**
   * Get document templates
   *
   * @param {string} templateLibrary Template library
   * @param {string} viewXml View XML (CAML query)
   */
  public async getDocumentTemplates(templateLibrary: string, viewXml: string) {
    return await this.portal.getItems(
      templateLibrary,
      TemplateItem,
      {
        ViewXml: viewXml
      },
      ['File', 'Folder', 'FieldValuesAsText']
    )
  }

  /**
   * Get libraries in web
   */
  public async getLibraries(): Promise<ISPLibraryFolder[]> {
    const libraries = await this.sp.web.lists
      .select('Id', 'Title', 'RootFolder/ServerRelativeUrl', 'RootFolder/Folders')
      .expand('RootFolder', 'RootFolder/Folders')
      .filter(
        // eslint-disable-next-line quotes
        "BaseTemplate eq 101 and IsCatalog eq false and IsApplicationList eq false and ListItemEntityTypeFullName ne 'SP.Data.FormServerTemplatesItem'"
      )
      .get()

    return libraries.map((lib) => ({
      Id: lib.Id,
      Title: lib.Title,
      ServerRelativeUrl: lib.RootFolder.ServerRelativeUrl,
      Folders: lib.RootFolder.Folders.filter((f: { Name: string }) => f.Name !== 'Forms').map(
        (f: { UniqueId: string; Name: string; ServerRelativeUrl: string }) => ({
          Id: f.UniqueId,
          Title: f.Name,
          ServerRelativeUrl: f.ServerRelativeUrl
        })
      )
    }))
  }
})()
