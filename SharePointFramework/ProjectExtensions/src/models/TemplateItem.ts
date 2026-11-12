import { stringIsNullOrEmpty } from '@pnp/core'
import { fileFromServerRelativePath, IFileInfo } from '@pnp/sp/files'
import { folderFromServerRelativePath, IFolder } from '@pnp/sp/folders'
import { IWeb } from '@pnp/sp/webs'
import { FileIconType, IFileTypeIconOptions } from '@fluentui/react-file-type-icons'
import { formatDate } from 'pp365-shared-library/lib/util/formatDate'

/** SharePoint file or folder metadata used to construct a document template. */
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

/** Document template with editable copy metadata and recursive folder-copy support. */
export class TemplateItem {
  public id: string

  public name: string

  public title: string

  public description: string

  public phase: string

  public newName: string

  public newTitle: string

  public serverRelativeUrl: string

  public modified: string

  public errorMessage: string

  constructor(
    private _item: ITemplateSPItem,
    public web: IWeb
  ) {
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
   * Copies under the edited name, recursively for folders; file copies also use the edited title.
   *
   * @returns The copied file, or the first directly contained file for a folder; null if none.
   */
  public async copyTo(folder: IFolder, shouldOverwrite: boolean = true): Promise<IFileInfo> {
    if (this.isFolder) {
      return await this.copyFolderWithContents(folder, shouldOverwrite)
    } else {
      const content = await this.web.getFileByServerRelativePath(this.serverRelativeUrl).getBlob()

      const fileInfo = await folder.files.addUsingPath(this.newName, content, {
        Overwrite: shouldOverwrite
      })
      await this.setFileTitle(folder, fileInfo, this.newTitle)
      return fileInfo
    }
  }

  /**
   * Copies a folder and its descendants, skipping failed children.
   *
   * @returns The first file copied directly into the new folder, or null if none.
   */
  private async copyFolderWithContents(
    targetFolder: IFolder,
    shouldOverwrite: boolean = true
  ): Promise<IFileInfo> {
    const newFolderInfo = await targetFolder.folders.addUsingPath(this.newName, true)
    const newFolder = folderFromServerRelativePath(targetFolder, newFolderInfo.ServerRelativeUrl)

    const sourceFolder = this.web.getFolderByServerRelativePath(this.serverRelativeUrl)
    const [files, subFolders] = await Promise.all([
      sourceFolder.files.select('Name', 'ServerRelativeUrl', 'Title')(),
      sourceFolder.folders.select('Name', 'ServerRelativeUrl')()
    ])

    let firstFileResult: IFileInfo = null

    for (const file of files) {
      try {
        const content = await this.web.getFileByServerRelativePath(file.ServerRelativeUrl).getBlob()
        const fileInfo = await newFolder.files.addUsingPath(file.Name, content, {
          Overwrite: shouldOverwrite
        })
        if (!firstFileResult) {
          firstFileResult = fileInfo
        }
        if (file.Title) {
          await this.setFileTitle(newFolder, fileInfo, file.Title)
        }
      } catch {
        // A failed child must not prevent copying its siblings.
      }
    }

    for (const subFolder of subFolders) {
      if (subFolder.Name.startsWith('_') || subFolder.Name === 'Forms') {
        continue
      }
      try {
        await this.copySubFolder(subFolder.ServerRelativeUrl, newFolder, shouldOverwrite)
      } catch {
        // A failed child must not prevent copying its siblings.
      }
    }

    return firstFileResult
  }

  /** Copies a child folder recursively, preserving its name and its files' titles. */
  private async copySubFolder(
    sourceFolderUrl: string,
    targetFolder: IFolder,
    shouldOverwrite: boolean = true
  ): Promise<void> {
    const sourceFolder = this.web.getFolderByServerRelativePath(sourceFolderUrl)
    const [folderInfo, files, subFolders] = await Promise.all([
      sourceFolder.select('Name')(),
      sourceFolder.files.select('Name', 'ServerRelativeUrl', 'Title')(),
      sourceFolder.folders.select('Name', 'ServerRelativeUrl')()
    ])

    const newFolderInfo = await targetFolder.folders.addUsingPath(folderInfo.Name, true)
    const newFolder = folderFromServerRelativePath(targetFolder, newFolderInfo.ServerRelativeUrl)

    for (const file of files) {
      try {
        const content = await this.web.getFileByServerRelativePath(file.ServerRelativeUrl).getBlob()
        const fileInfo = await newFolder.files.addUsingPath(file.Name, content, {
          Overwrite: shouldOverwrite
        })
        if (file.Title) {
          await this.setFileTitle(newFolder, fileInfo, file.Title)
        }
      } catch {
        // A failed child must not prevent copying its siblings.
      }
    }

    for (const subFolder of subFolders) {
      if (subFolder.Name.startsWith('_') || subFolder.Name === 'Forms') {
        continue
      }
      try {
        await this.copySubFolder(subFolder.ServerRelativeUrl, newFolder, shouldOverwrite)
      } catch {
        // A failed child must not prevent copying its siblings.
      }
    }
  }

  /**
   * Updates the copied file's list-item title in the destination web.
   *
   * PnPjs 4 resolves `files.addUsingPath` to the file payload only, so the file is
   * re-addressed from `folder` (the web it was added to) rather than from `this.web`,
   * which is the web the template was read from.
   */
  private async setFileTitle(folder: IFolder, fileInfo: IFileInfo, title: string): Promise<void> {
    const item = await fileFromServerRelativePath(folder, fileInfo.ServerRelativeUrl).getItem()
    await item.update({ Title: title })
  }

  /** Applies non-empty edits without clearing existing metadata. */
  public update(properties: Record<string, string>) {
    Object.keys(properties).forEach((prop) => {
      if (!stringIsNullOrEmpty(properties[prop])) this[prop] = properties[prop]
    })
  }

  public get nameWithoutExtension() {
    return this.name.substring(0, this.name.lastIndexOf('.'))
  }

  public get fileExtension() {
    return this.name.substring(this.name.lastIndexOf('.') + 1)
  }

  public get parentFolderUrl() {
    return this.serverRelativeUrl.replace(`/${this.name}`, '')
  }

  public get isFolder() {
    return !!this._item.Folder
  }

  /** Path depth below the library root for /sites/<site>/<library> URLs. */
  public get level(): number {
    return this.serverRelativeUrl.split('/').length - 4
  }

  /** Chooses a folder or file-extension glyph, retaining the supplied display options. */
  public getFileTypeIconOptions(options: IFileTypeIconOptions = {}): IFileTypeIconOptions {
    if (this.isFolder) return { ...options, type: FileIconType.folder }
    return { ...options, extension: this.fileExtension }
  }
}
