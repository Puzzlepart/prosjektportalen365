/**
 * Configures workbook output and measurement-sheet field mapping.
 */
export interface IExcelExportServiceConfiguration {
  name?: string
  options?: {
    type: any
    bookType: any
  }
  measurementsSheetConfiguration?: {
    renameKeys: Record<string, { name: string; dataType?: string }>
    titleKey: string
  }
}
