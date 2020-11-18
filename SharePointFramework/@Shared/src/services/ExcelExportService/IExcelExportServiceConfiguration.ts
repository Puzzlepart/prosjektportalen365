export interface IExcelExportServiceConfiguration {
  name?: string
  sheetName?: string
  fileSaverVersion?: string
  xlsxVersion?: string
  options?: {
    type: string
    bookType: string
  }
}
