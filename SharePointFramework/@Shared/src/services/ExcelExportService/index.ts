/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as XLSX from 'xlsx'
import * as FileSaver from 'file-saver'
import { getObjectValue } from '../../helpers/getObjectValue'
import { stringToArrayBuffer } from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'

export default new (class ExcelExportService {
  private _configuration: IExcelExportServiceConfiguration

  public configure(configuration: IExcelExportServiceConfiguration) {
    this._configuration = { ...ExcelExportServiceDefaultConfiguration, ...configuration }
  }

  /**
   * Export to Excel
   *
   * @param {any[]} items Items
   * @param {IColumn[]} columns Columns
   */
  public export(items: any[], columns: IColumn[]) {
    try {
      const sheets = []
      const _columns = columns.filter((column) => column.name)
      sheets.push({
        name: this._configuration.sheetName,
        data: [
          _columns.map((column) => column.name),
          ...items.map((item) =>
            _columns.map((column) => getObjectValue<string>(item, column.fieldName, null))
          )
        ]
      })
      const workBook = XLSX.utils.book_new()
      sheets.forEach((s, index) => {
        const sheet = XLSX.utils.aoa_to_sheet(s.data)
        XLSX.utils.book_append_sheet(workBook, sheet, s.name || `Sheet${index + 1}`)
      })
      const wbout = XLSX.write(workBook, this._configuration.options)
      FileSaver.saveAs(
        new Blob([stringToArrayBuffer(wbout)], { type: 'application/octet-stream' }),
        format('{0}-{1}.xlsx', this._configuration.name, new Date().toISOString())
      )
    } catch (error) {
      throw new Error(error)
    }
  }
})()

export { IColumn as ExcelExportColumn }
