/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { format } from 'office-ui-fabric-react/lib/Utilities'
import * as $script from 'scriptjs'
import { getObjectValue } from '../../helpers/getObjectValue'
import { stringToArrayBuffer } from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'

export default new (class ExcelExportService {
  private _configuration: IExcelExportServiceConfiguration
  private _deps: string[]

  public configure(configuration: IExcelExportServiceConfiguration) {
    this._configuration = { ...ExcelExportServiceDefaultConfiguration, ...configuration }
    this._deps = [
      `FileSaver.js/${this._configuration.fileSaverVersion}/FileSaver.min.js`,
      `xlsx/${this._configuration.xlsxVersion}/xlsx.full.min.js`
    ]
    $script.path('https://cdnjs.cloudflare.com/ajax/libs/')
  }

  /**
   * Load dependencies in _deps
   *
   * @param {string[]} deps Deps
   */
  protected loadDeps(): Promise<void> {
    return new Promise<void>((resolve) => {
      const _define = ((<any>window).define(window as any).define = undefined)
      $script(this._deps, 'deps')
      $script.ready('deps', () => {
        ;(window as any).define = _define
        resolve()
      })
    })
  }

  /**
   * Export to Excel
   *
   * @param {any[]} items Items
   * @param {IColumn[]} columns Columns
   */
  public async export(items: any[], columns: IColumn[]) {
    try {
      await this.loadDeps()
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
      const workBook = (<any>window).XLSX.utils.book_new()
      sheets.forEach((s, index) => {
        const sheet = (<any>window).XLSX.utils.aoa_to_sheet(s.data)
        ;(<any>window).XLSX.utils.book_append_sheet(workBook, sheet, s.name || `Sheet${index + 1}`)
      })
      const wbout = (<any>window).XLSX.write(workBook, this._configuration.options)
      ;(<any>window).saveAs(
        new Blob([stringToArrayBuffer(wbout)], { type: 'application/octet-stream' }),
        format('{0}-{1}.xlsx', this._configuration.name, new Date().toISOString())
      )
    } catch (error) {
      throw new Error(error)
    }
  }
})()

export { IColumn as ExcelExportColumn }
