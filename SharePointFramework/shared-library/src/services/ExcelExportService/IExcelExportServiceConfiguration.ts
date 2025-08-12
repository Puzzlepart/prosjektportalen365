export interface IExcelExportServiceConfiguration {
  name?: string
  sheetName?: string
  fileSaverVersion?: string
  xlsxVersion?: string
  options?: {
    type: any
    bookType: any
  }
  measurementsSheetConfiguration?: {
    skipKeys: string[]
    renameKeys: Record<string, { name: string; dataType?: string }>
    titleKey: string
  }
}
