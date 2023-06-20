import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'

export const ExcelExportServiceDefaultConfiguration: IExcelExportServiceConfiguration =
  {
    sheetName: 'Sheet1',
    fileSaverVersion: '1.3.8',
    xlsxVersion: '0.14.5',
    options: { type: 'binary', bookType: 'xlsx' }
  }
