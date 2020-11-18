import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { FileAddResult, Folder, Web } from '@pnp/sp'
import { formatDate } from 'shared/lib/helpers'

export interface ITemplateFileSPItem {
  File?: {
    UniqueId: string
    Name: string
    Title: string
    ServerRelativeUrl: string
    TimeLastModified: string
  }
  FieldValuesAsText?: TypedHash<string>
}

export class TemplateFile {
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

  constructor(spItem: ITemplateFileSPItem, public web: Web) {
    this.id = spItem.File.UniqueId
    this.name = spItem.File.Name
    this.title = spItem.File.Title
    this.phase = spItem.FieldValuesAsText.GtProjectPhase
    this.newName = this.name
    this.newTitle = this.title
    this.serverRelativeUrl = spItem.File.ServerRelativeUrl
    this.modified = formatDate(spItem.File.TimeLastModified)
  }

  /**
   * Copy to
   *
   * @param {Folder} folder Folder
   * @param {boolean} shouldOverwrite Should overwrite
   *
   * @returns true if the operation is successful
   */
  public async copyTo(folder: Folder, shouldOverwrite = true): Promise<FileAddResult> {
    try {
      const content = await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getBlob()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const fileAddResult = await folder.files.addChunked(
        this.newName,
        content,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => {},
        shouldOverwrite
      )
      await (await fileAddResult.file.getItem()).update({ Title: this.newTitle })
      return fileAddResult
    } catch (error) {
      throw error
    }
  }

  /**
   * On input changed
   *
   * @param {Object} properties Updated properties
   */
  public update(properties: TypedHash<string>) {
    Object.keys(properties).forEach((prop) => {
      if (!stringIsNullOrEmpty(properties[prop])) this[prop] = properties[prop]
    })
  }

  public get nameWithoutExtension() {
    return this.name.split('.')[0]
  }

  public get fileExtension() {
    return this.name.split('.')[1]
  }

  public get folderServerRelativeUrl() {
    return this.serverRelativeUrl.replace(this.name, '')
  }
}
