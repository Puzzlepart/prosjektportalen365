/**
 * Defines the workbook naming and command label for an export.
 */
export interface IExcelExportConfig {
  fileNamePrefix: string
  sheetName: string
  buttonLabel?: string
  buttonIcon?: string
}
