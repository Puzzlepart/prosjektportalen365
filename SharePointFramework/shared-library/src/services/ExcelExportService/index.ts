/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { format, IColumn } from '@fluentui/react'
import * as XLSX from 'xlsx'
import * as FileSaver from 'file-saver'
import { getObjectValue } from '../../helpers/getObjectValue'
import { stringToArrayBuffer } from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'
import { getDateValue } from '../../helpers/getDateValue'

export default new (class ExcelExportService {
  public configuration: IExcelExportServiceConfiguration

  public configure(configuration: IExcelExportServiceConfiguration) {
    this.configuration = { ...ExcelExportServiceDefaultConfiguration, ...configuration }
  }

  /**
   * Export to Excel
   *
   * @param items Items
   * @param columns Columns
   */
  public export(items: any[], columns: IColumn[]) {
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
                : getObjectValue<string>(item, column.fieldName, null)
            })
          )
        ]
      })
      const workBook = XLSX.utils.book_new()
      sheets.forEach((s, index) => {
        const sheet = XLSX.utils.aoa_to_sheet(s.data)
        XLSX.utils.book_append_sheet(workBook, sheet, s.name || `Sheet${index + 1}`)
      })
      const wbout = XLSX.write(workBook, this.configuration.options)
      FileSaver.saveAs(
        new Blob([stringToArrayBuffer(wbout)], { type: 'application/octet-stream' }),
        format('{0}-{1}.xlsx', this.configuration.name, new Date().toISOString())
      )
    } catch (error) {
      throw new Error(error)
    }
  }
})()

export { IColumn as ExcelExportColumn }
