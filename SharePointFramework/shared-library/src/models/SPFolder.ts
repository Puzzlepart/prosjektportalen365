interface ISPFolderData {
  Id?: string
  UniqueId?: string
  Title?: string
  Name?: string
  ServerRelativeUrl?: string
  RootFolder?: ISPFolderData
  Folders?: ISPFolderData[]
  BaseTemplate?: number
}

/**
 * @model SPFolder
 */
export class SPFolder {
  public id: string
  public name: string
  public url: string
  public folders: SPFolder[]

  /**
   * Constructor
   *
   * @param _data Data
   */
  constructor(private _data: ISPFolderData) {
    this.id = _data?.Id || _data?.UniqueId
    this.name = _data?.Title || _data?.Name
    this.url = _data?.RootFolder?.ServerRelativeUrl || _data?.ServerRelativeUrl
    this.folders = (_data?.RootFolder?.Folders || _data?.Folders || [])
      .map((f: any) => new SPFolder(f))
      .filter((f: SPFolder) => !f.isSystemFolder)
  }

  /**
   * Is system folder
   *
   * Returns true if the folder name is Forms
   */
  public get isSystemFolder(): boolean {
    return this.name === 'Forms'
  }

  /**
   * Checks if the folder is root level meaning it's a library.
   *
   * Checks if BaseTemplate is 101
   */
  public get isLibrary() {
    return this._data.BaseTemplate === 101
  }
}
