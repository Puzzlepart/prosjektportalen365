import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'

/**
 * Uses binary XLSX output as the default workbook format.
 */
export const ExcelExportServiceDefaultConfiguration: IExcelExportServiceConfiguration = {
  options: { type: 'binary', bookType: 'xlsx' }
}
