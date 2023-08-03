import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import { SPFolder } from 'models'
import { TemplateItem } from 'models/TemplateItem'
import { SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import { ProjectDataService } from 'pp365-shared-library/lib/services'
import * as strings from 'ProjectExtensionsStrings'
import validFilename from 'valid-filename'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'
import { getHashCode, dateAdd } from '@pnp/core'
import { Caching } from '@pnp/queryable'

/**
 * Default caching configuration for `SPDataAdapter`.
 *
 * - `store`: `local`
 * - `keyFactory`: Hash code of the URL
 * - `expireFunc`: 60 minutes from now
 */
const DefaultCaching = Caching({
  store: 'local',
  keyFactory: (url) => getHashCode(url.toLowerCase()).toString(),
  expireFunc: () => dateAdd(new Date(), 'minute', 60)
})

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
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: strings.ProjectPropertiesListName
    })
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
      .getFolderByServerRelativePath(folderServerRelativeUrl)
      .files.filter(`Name eq '${name}'`)()
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
      .folders.using(DefaultCaching)()
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
      .using(DefaultCaching)()
    return libraries.map((lib) => new SPFolder(lib))
  }
}

export default new SPDataAdapter()
