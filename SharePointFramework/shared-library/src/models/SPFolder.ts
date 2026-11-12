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
 * Maps a document library or folder and its descendants, excluding the Forms system folder.
 */
export class SPFolder {
  public id: string
  public name: string
  public url: string
  public folders: SPFolder[]

  constructor(private _data: ISPFolderData) {
    this.id = _data?.Id || _data?.UniqueId
    this.name = _data?.Title || _data?.Name
    this.url = _data?.RootFolder?.ServerRelativeUrl || _data?.ServerRelativeUrl
    this.folders = (_data?.RootFolder?.Folders || _data?.Folders || [])
      .map((f: any) => new SPFolder(f))
      .filter((f: SPFolder) => !f.isSystemFolder)
  }

  /**
   * Identifies SharePoint's Forms system folder.
   */
  public get isSystemFolder(): boolean {
    return this.name === 'Forms'
  }

  /**
   * Identifies document libraries by SharePoint base template 101.
   */
  public get isLibrary() {
    return this._data.BaseTemplate === 101
  }
}
