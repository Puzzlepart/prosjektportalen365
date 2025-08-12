import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'

export const ExcelExportServiceDefaultConfiguration: IExcelExportServiceConfiguration = {
  sheetName: 'Sheet1',
  fileSaverVersion: '1.3.8',
  xlsxVersion: '0.14.5',
  options: { type: 'binary', bookType: 'xlsx' },
  measurementsSheetConfiguration: {
    skipKeys: ['ValueDisplay', 'AchievementDisplay'],
    renameKeys: {
      Title: { name: 'Måling' },
      Value: { name: 'Målt verdi' },
      Comment: { name: 'Kommentar til måling' },
      Achievement: { name: 'Måloppnåelse' },
      DateDisplay: { name: 'Dato for måling', dataType: 'date' }
    },
    titleKey: 'Tittel'
  }
}
