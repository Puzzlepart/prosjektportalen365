import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import { FileAddResult, Folder, Web } from '@pnp/sp'
import { formatDate } from 'pp365-shared/lib/helpers'

export interface ITemplateSPItem {
  Folder?: {
    ItemCount: number;
    Name: string;
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
  FieldValuesAsText?: TypedHash<string>
}

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

  constructor(private _item: ITemplateSPItem, public web: Web) {
    this.id = _item.File?.UniqueId
    this.name = _item.File?.Name || _item.Folder?.Name
    this.title = _item.File?.Title || this.name || _item.Folder?.Name
    this.phase = _item.FieldValuesAsText.GtProjectPhase
    this.newName = this.name
    this.newTitle = this.title
    this.serverRelativeUrl = _item.File?.ServerRelativeUrl || _item.Folder.ServerRelativeUrl
    this.modified = formatDate(_item.File?.TimeLastModified || _item.Folder?.TimeLastModified)
  }

  /**
   * Copy item to folder
   *
   * @param {Folder} folder Folder
   * @param {boolean} shouldOverwrite Should overwrite
   *
   * @returns {true} if the operation is successful
   */
  public async copyTo(folder: Folder, shouldOverwrite: boolean = true): Promise<FileAddResult> {
    try {
      const content = await this.web.getFileByServerRelativeUrl(this.serverRelativeUrl).getBlob()
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const fileAddResult = await folder.files.addChunked(
        this.newName,
        content,
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        () => { },
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
   * Folder server relative URL
   */
  public get folderServerRelativeUrl() {
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
}
