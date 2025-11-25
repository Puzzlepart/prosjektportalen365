import { IIconProps } from '@fluentui/react/lib/Icon'
import { stringIsNullOrEmpty } from '@pnp/core'
import { IFileAddResult } from '@pnp/sp/files'
import { IFolder } from '@pnp/sp/folders'
import { IWeb } from '@pnp/sp/webs'
import { FileIconType, getFileTypeIconProps, IFileTypeIconOptions } from '@uifabric/file-type-icons'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'

export interface ITemplateSPItem {
  Folder?: {
    UniqueId: string
    ItemCount: number
    Name: string
    ServerRelativeUrl: string
    TimeLastModified: string
  }
  File?: {
    UniqueId: string
    Name: string
    Title: string
    ServerRelativeUrl: string
    TimeLastModified: string
  }
  FieldValuesAsText?: Record<string, string>
}

/**
 * @model TemplateItem
 */
export class TemplateItem {
  /**
   * Item id
   */
  public id: string

  /**
   * Name
   */
  public name: string

  /**
   * Title
   */
  public title: string

  /**
   * The template description
   */
  public description: string

  /**
   * The project phase
   */
  public phase: string

  /**
   * The new name
   */
  public newName: string

  /**
   * The new title
   */
  public newTitle: string

  /**
   * Server relative URL for the template file
   */
  public serverRelativeUrl: string

  /**
   * Modified time
   */
  public modified: string

  /**
   * Error message for the input field for name
   */
  public errorMessage: string

  constructor(private _item: ITemplateSPItem, public web: IWeb) {
    this.id = _item.File?.UniqueId || _item.Folder.UniqueId
    this.name = _item.File?.Name || _item.Folder?.Name
    this.title = _item.File?.Title || this.nameWithoutExtension || _item.Folder?.Name
    this.description = _item.FieldValuesAsText.GtDescription
    this.phase = _item.FieldValuesAsText.GtProjectPhase
    this.newName = this.name
    this.newTitle = this.title
    this.serverRelativeUrl = _item.File?.ServerRelativeUrl || _item.Folder.ServerRelativeUrl
    this.modified = formatDate(_item.File?.TimeLastModified || _item.Folder?.TimeLastModified)
  }

  /**
   * Copy item to folder
   *
   * @param folder Folder
   * @param shouldOverwrite Should overwrite
   *
   * @returns {true} if the operation is successful
   */
  public async copyTo(folder: IFolder, shouldOverwrite: boolean = true): Promise<IFileAddResult> {
    try {
      if (this.isFolder) {
        return await this.copyFolderWithContents(folder, shouldOverwrite)
      } else {
        const content = await this.web.getFileByServerRelativePath(this.serverRelativeUrl).getBlob()
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const fileAddResult = await folder.files.addUsingPath(this.newName, content, {
          Overwrite: shouldOverwrite
        })
        await (await fileAddResult.file.getItem()).update({ Title: this.newTitle })
        return fileAddResult
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Copy folder with all its contents recursively
   *
   * @param targetFolder Target folder
   * @param shouldOverwrite Should overwrite
   *
   * @returns File add result for the first file copied (or null if no files)
   */
  private async copyFolderWithContents(
    targetFolder: IFolder,
    shouldOverwrite: boolean = true
  ): Promise<IFileAddResult> {
    try {
      const newFolder = await targetFolder.folders.addUsingPath(this.newName, true)

      const sourceFolder = this.web.getFolderByServerRelativePath(this.serverRelativeUrl)
      const [files, subFolders] = await Promise.all([
        sourceFolder.files.select('Name', 'ServerRelativeUrl', 'Title')(),
        sourceFolder.folders.select('Name', 'ServerRelativeUrl')()
      ])

      let firstFileResult: IFileAddResult = null

      for (const file of files) {
        try {
          const content = await this.web.getFileByServerRelativePath(file.ServerRelativeUrl).getBlob()
          const fileAddResult = await newFolder.folder.files.addUsingPath(file.Name, content, {
            Overwrite: shouldOverwrite
          })
          if (!firstFileResult) {
            firstFileResult = fileAddResult
          }
          if (file.Title) {
            await (await fileAddResult.file.getItem()).update({ Title: file.Title })
          }
        } catch (error) {
          // Continue with next file if one fails
        }
      }

      for (const subFolder of subFolders) {
        if (subFolder.Name.startsWith('_') || subFolder.Name === 'Forms') {
          continue
        }
        try {
          await this.copySubFolder(subFolder.ServerRelativeUrl, newFolder.folder, shouldOverwrite)
        } catch (error) {
          // Continue with next folder if one fails
        }
      }

      return firstFileResult
    } catch (error) {
      throw error
    }
  }

  /**
   * Copy a subfolder recursively
   *
   * @param sourceFolderUrl Source folder server relative URL
   * @param targetFolder Target folder
   * @param shouldOverwrite Should overwrite
   */
  private async copySubFolder(
    sourceFolderUrl: string,
    targetFolder: IFolder,
    shouldOverwrite: boolean = true
  ): Promise<void> {
    try {
      const sourceFolder = this.web.getFolderByServerRelativePath(sourceFolderUrl)
      const [folderInfo, files, subFolders] = await Promise.all([
        sourceFolder.select('Name')(),
        sourceFolder.files.select('Name', 'ServerRelativeUrl', 'Title')(),
        sourceFolder.folders.select('Name', 'ServerRelativeUrl')()
      ])

      const newFolder = await targetFolder.folders.addUsingPath(folderInfo.Name, true)

      for (const file of files) {
        try {
          const content = await this.web.getFileByServerRelativePath(file.ServerRelativeUrl).getBlob()
          const fileAddResult = await newFolder.folder.files.addUsingPath(file.Name, content, {
            Overwrite: shouldOverwrite
          })
          if (file.Title) {
            await (await fileAddResult.file.getItem()).update({ Title: file.Title })
          }
        } catch (error) {
          // Continue with next file if one fails
        }
      }

      for (const subFolder of subFolders) {
        if (subFolder.Name.startsWith('_') || subFolder.Name === 'Forms') {
          continue
        }
        try {
          await this.copySubFolder(subFolder.ServerRelativeUrl, newFolder.folder, shouldOverwrite)
        } catch (error) {
          // Continue with next folder if one fails
        }
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * On input changed
   *
   * @param properties Updated properties
   */
  public update(properties: Record<string, string>) {
    Object.keys(properties).forEach((prop) => {
      if (!stringIsNullOrEmpty(properties[prop])) this[prop] = properties[prop]
    })
  }

  /**
   * Name without extension
   */
  public get nameWithoutExtension() {
    return this.name.split('.')[0]
  }

  /**
   * File extension
   */
  public get fileExtension() {
    return this.name.split('.')[1]
  }

  /**
   * Parent folder URL
   */
  public get parentFolderUrl() {
    return this.serverRelativeUrl.replace(`/${this.name}`, '')
  }

  /**
   * Is folder
   */
  public get isFolder() {
    return !!this._item.Folder
  }

  /**
   * Folder level
   *
   * Root level returns 1 etc
   */
  public get level(): number {
    return this.serverRelativeUrl.split('/').length - 4
  }

  /**
   * Get icon props
   */
  public getIconProps(options: IFileTypeIconOptions = {}): IIconProps {
    if (this.isFolder) options.type = FileIconType.folder
    else options.extension = this.fileExtension
    return getFileTypeIconProps(options)
  }
}
