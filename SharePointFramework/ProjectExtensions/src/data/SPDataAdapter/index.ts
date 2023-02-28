import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { SPFolder } from 'models'
import { TemplateItem } from 'models/TemplateItem'
import { SPDataAdapterBase } from 'pp365-shared/lib/data'
import { ProjectDataService } from 'pp365-shared/lib/services'
import * as strings from 'ProjectExtensionsStrings'
import * as validFilename from 'valid-filename'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'

class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService

  /**
   * Configure the SP data adapter
   *
   * @param spfxContext Context
   * @param settings Settings
   */
  public async configure(
    spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext,
    settings: ISPDataAdapterConfiguration
  ) {
    await super.configure(spfxContext, settings)
    this.project = new ProjectDataService(
      {
        ...this.settings,
        entityService: this.entityService,
        propertiesListName: strings.ProjectPropertiesListName
      },
      this.spConfiguration
    )
  }

  /**
   * Checks if the filename is valid
   *
   * @param folderServerRelativeUrl Folder server relative URL
   * @param name File name
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
   * Get document templates from the specified library on the hub site
   *
   * @param libraryName Library name
   * @param viewXml View XML (CAML query)
   */
  public async getDocumentTemplates(libraryName: string, viewXml: string) {
    return await this.portal.getItems(
      libraryName,
      TemplateItem,
      {
        ViewXml: viewXml
      },
      ['File', 'Folder', 'FieldValuesAsText']
    )
  }

  /**
   * Get folders in the specified folder/library
   *
   * @param folderRelativeUrl Folder URL
   */
  public async getFolders(folderRelativeUrl: string): Promise<any[]> {
    const folders = await this.sp.web
      .getFolderByServerRelativePath(folderRelativeUrl)
      .folders.usingCaching()
      .get()
    return folders.map((f) => new SPFolder(f)).filter((f) => !f.isSystemFolder)
  }

  /**
   * Get libraries in the current web
   */
  public async getLibraries(): Promise<SPFolder[]> {
    const libraries = await this.sp.web.lists
      .select('Id', 'Title', 'BaseTemplate', 'RootFolder/ServerRelativeUrl', 'RootFolder/Folders')
      .expand('RootFolder', 'RootFolder/Folders')
      .filter(
        [
          'BaseTemplate eq 101',
          'IsCatalog eq false',
          'IsApplicationList eq false',
          // eslint-disable-next-line quotes
          "ListItemEntityTypeFullName ne 'SP.Data.FormServerTemplatesItem'"
        ].join(' and ')
      )
      .usingCaching()
      .get()
    return libraries.map((lib) => new SPFolder(lib))
  }
}

export default new SPDataAdapter()
