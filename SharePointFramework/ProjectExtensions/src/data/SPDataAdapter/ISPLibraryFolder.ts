export interface ISPLibraryFolder {
  Id: string
  Title: string
  ServerRelativeUrl: string
  Folders?: ISPLibraryFolder[]
}
