import { ApplicationCustomizerContext } from '@microsoft/sp-application-base'
import { ListViewCommandSetContext } from '@microsoft/sp-listview-extensibility'
import * as strings from 'ProjectExtensionsStrings'
import { TemplateItem } from 'models/TemplateItem'
import { SPFolder, TEMPLATE_PACKAGE_STORE_FOLDER } from 'pp365-shared-library'
import { DefaultCaching, SPDataAdapterBase } from 'pp365-shared-library/lib/data'
import { IProjectDataServiceParams, ProjectDataService } from 'pp365-shared-library/lib/services'
import validFilename from 'valid-filename'
import { ISPDataAdapterConfiguration } from './ISPDataAdapterConfiguration'
import resource from 'SharedResources'

/** SharePoint access for project setup and document-template selection. */
class SPDataAdapter extends SPDataAdapterBase<ISPDataAdapterConfiguration> {
  public project: ProjectDataService

  /** Initializes the adapter and the current project's data service. */
  public async configure(
    spfxContext: ApplicationCustomizerContext | ListViewCommandSetContext,
    settings: ISPDataAdapterConfiguration
  ) {
    await super.configure(spfxContext, settings)
    this.project = new ProjectDataService({
      ...this.settings,
      spfxContext,
      entityService: this.entityService,
      propertiesListName: resource.Lists_ProjectProperties_Title
    } as IProjectDataServiceParams)
  }

  /**
   * Validates a file or folder name against syntax rules and existing siblings.
   *
   * @returns A localized validation error, or null when the name is available.
   */
  public async isFilenameValid(
    folderServerRelativeUrl: string,
    name: string,
    isFolder: boolean = false
  ): Promise<string | null> {
    if (!validFilename(name))
      return isFolder ? strings.FolderNameInValidErrorText : strings.FilenameInValidErrorText

    const targetName = name.toLowerCase()
    if (isFolder) {
      const folders =
        (await this.sp.web.getFolderByServerRelativePath(folderServerRelativeUrl).folders()) ?? []
      const existingFolder = folders.find((f) => f?.Name?.toLowerCase() === targetName)
      if (existingFolder) {
        return strings.FolderNameAlreadyInUseErrorText
      }
    } else {
      const files =
        (await this.sp.web.getFolderByServerRelativePath(folderServerRelativeUrl).files()) ?? []
      const existingFile = files.find((f) => f?.Name?.toLowerCase() === targetName)
      if (existingFile) {
        return strings.FilenameAlreadyInUseErrorText
      }
    }
    return null
  }

  /** Reads hub document templates matching a CAML view, excluding provisioning assets. */
  public async getDocumentTemplates(libraryName: string, viewXml: string) {
    const items = await this.portalDataService.getItems(
      libraryName,
      TemplateItem,
      {
        ViewXml: viewXml
      },
      ['File', 'Folder', 'FieldValuesAsText']
    )
    // The template package catalog stores imported packages' provisioning
    // assets under <library>/pp-packages/ — wizard inputs, not document
    // templates — so that folder and everything in it is excluded here.
    return items.filter(
      (item) => !(item.serverRelativeUrl ?? '').split('/').includes(TEMPLATE_PACKAGE_STORE_FOLDER)
    )
  }

  /** Reads non-system child folders from a folder's server-relative URL. */
  public async getFolders(folderRelativeUrl: string): Promise<any[]> {
    const folders =
      (await this.sp.web
        .getFolderByServerRelativePath(folderRelativeUrl)
        .folders.using(DefaultCaching)()) ?? []
    return folders.map((f) => new SPFolder(f)).filter((f) => !f.isSystemFolder)
  }

  /** Lists document libraries, excluding catalogs, application lists and form templates. */
  public async getLibraries(): Promise<SPFolder[]> {
    const libraries =
      (await this.sp.web.lists
        .select('Id', 'Title', 'BaseTemplate', 'RootFolder/ServerRelativeUrl', 'RootFolder/Folders')
        .expand('RootFolder', 'RootFolder/Folders')
        .filter(
          [
            'BaseTemplate eq 101',
            'IsCatalog eq false',
            'IsApplicationList eq false',

            "ListItemEntityTypeFullName ne 'SP.Data.FormServerTemplatesItem'"
          ].join(' and ')
        )()) ?? []
    return libraries.map((lib) => new SPFolder(lib))
  }
}

/** Configured adapter instance shared by the project extensions. */
export default new SPDataAdapter()
