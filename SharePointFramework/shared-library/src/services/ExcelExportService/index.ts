/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { format, IColumn } from '@fluentui/react'
import * as XLSX from 'xlsx'
import * as FileSaver from 'file-saver'
import { stringToArrayBuffer } from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'
import { getDateValue,getObjectValue as get } from '../../util'

class ExcelExportService {
  public configuration: IExcelExportServiceConfiguration

  public configure(configuration: IExcelExportServiceConfiguration) {
    this.configuration = { ...ExcelExportServiceDefaultConfiguration, ...configuration }
  }

  /**
   * Export the items with the given columns to an Excel file.
   * - The columns are used to create the header row.
   * - The items are used to create the data rows.
   * - The sheet name is taken from the configuration with a fallback to `Sheet1`.
   * - The file name is taken from the configuration.
   * - The file extension is hardcoded to `.xlsx`.
   *
   * @param items Items
   * @param columns Columns
   * @param fileNamePart Optional file name part to add after the name and before the date
   */
  public export(items: Record<string, any>[], columns: IColumn[], fileNamePart?: string) {
    const fileNameFormat = fileNamePart ? '{0}-{1}-{2}.xlsx' : '{0}-{1}.xlsx'
    try {
      const sheets = []
      const _columns = columns.filter((column) => column.name)
      sheets.push({
        name: this.configuration.sheetName,
        data: [
          _columns.map((column) => column.name),
          ...items.map((item) =>
            _columns.map((column) => {
              return (column as any).dataType === 'date'
                ? getDateValue(item, column.fieldName)
                : get<string>(item, column.fieldName, null)
            })
          )
        ]
      })
      const workBook = XLSX.utils.book_new()
      sheets.forEach((s, index) => {
        const sheet = XLSX.utils.aoa_to_sheet(s.data)
        XLSX.utils.book_append_sheet(workBook, sheet, s.name ?? `Sheet${index + 1}`)
      })
      const wbout = XLSX.write(workBook, this.configuration.options)
      const fileName = fileNamePart
        ? format(fileNameFormat, this.configuration.name, fileNamePart, new Date().toISOString())
        : format(fileNameFormat, this.configuration.name, new Date().toISOString())
      FileSaver.saveAs(
        new Blob([stringToArrayBuffer(wbout)], { type: 'application/octet-stream' }),
        fileName
      )
    } catch (error) {
      throw new Error(error)
    }
  }
}

export default new ExcelExportService()

export { IColumn as ExcelExportColumn }
