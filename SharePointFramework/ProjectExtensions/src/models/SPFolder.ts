interface ISPFolderData {
  Id?: string;
  UniqueId?: string
  Title?: string
  Name?: string
  ServerRelativeUrl?: string
  RootFolder?: ISPFolderData
  Folders?: ISPFolderData[]
}

export class SPFolder {
  public id: string
  public name: string
  public url: string
  public folders: SPFolder[]

  /**
   * Constructor
   *
   * @param {ISPFolderData} data Data
   */
  constructor(data: ISPFolderData) {
    this.id = data?.Id || data?.UniqueId
    this.name = data?.Title || data?.Name
    this.url = data?.RootFolder?.ServerRelativeUrl || data?.ServerRelativeUrl
    this.folders = (data?.RootFolder?.Folders || data?.Folders || [])
      .map(
        (f: any) => new SPFolder(f)
      )
      .filter((f: SPFolder) => !f.isSystemFolder)
  }

  public get isSystemFolder(): boolean {
    return this.name === 'Forms'
  }
}
