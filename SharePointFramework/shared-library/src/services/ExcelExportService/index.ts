/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { format, IColumn } from '@fluentui/react'
import * as FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import { getDateForExcelExport, getObjectValue as get, stringToArrayBuffer } from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'

class ExcelExportService {
  public configuration: IExcelExportServiceConfiguration
  public isConfigured = false

  /**
   * Configures the `ExcelExportService` with the provided configuration options.
   *
   * @param configuration - The configuration options to apply.
   */
  public configure(configuration: IExcelExportServiceConfiguration) {
    this.configuration = { ...ExcelExportServiceDefaultConfiguration, ...configuration }
    this.isConfigured = true
  }

  /**
   * Parses a field from an item as a JSON array of objects.
   * - Copies the item's 'Title' to each entry.
   * - Renames 'Title' in entries to 'Måling'.
   * - Skips properties with object values.
   * Returns an empty array if parsing fails.
   *
   * @param item The object containing the field.
   * @param column The field name to parse.
   * @returns Array of transformed objects or empty array.
   */
  private parseJSONColumn(item: Record<string, any>, column: string): Record<string, any>[] {
    const value = item[column]
    if (typeof value !== 'string' || !value.trim()) return []
    const skipKeys = ['ValueDisplay', 'AchievementDisplay']
    const renameKeys: Record<string, string> = {
      Title: 'Måling',
      Value: 'Målt verdi',
      Comment: 'Kommentar til måling',
      Achievement: 'Måloppnåelse',
      DateDisplay: 'Dato for måling'
    }
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed)) return []
      return parsed.map((entry: any) => ({
        Tittel: item['Title'],
        ...Object.fromEntries(
          Object.entries(entry)
            .filter(([key, val]) => typeof val !== 'object' && !skipKeys.includes(key))
            .map(([key, val]) => {
              const renamedKey = renameKeys[key] || key
              const transformedVal =
                key === 'Achievement' && typeof val === 'number' ? Math.floor(val * 100) / 100 : val
              return [renamedKey, transformedVal]
            })
        )
      }))
    } catch (error) {
      throw new Error(`Error parsing JSON in column "${column}": ${error}`)
    }
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
   * @param sheetNamePrefix Optional prefix for the sheet name
   */
  public export(
    items: Record<string, any>[],
    columns: IColumn[],
    fileNamePart?: string,
    sheetNamePrefix: string = 'Sheet'
  ) {
    const fileNameFormat = fileNamePart ? '{0}-{1}-{2}.xlsx' : '{0}-{1}.xlsx'
    try {
      const sheets = []
      const additionalColumn = this.configuration?.newSheet?.column
      const _columns = columns.filter(
        (column) => column.fieldName !== additionalColumn && Boolean(column.name)
      )
      sheets.push({
        name: this.configuration.name,
        data: [
          _columns.map(({ name }) => name),
          ...items.map((item) =>
            _columns.map((column) => {
              switch ((column as any).dataType) {
                case 'date': {
                  return getDateForExcelExport(
                    item[column.fieldName],
                    column.data?.dataTypeProperties?.includeTime
                  )
                }
                default: {
                  return get(item, column.fieldName, null)
                }
              }
            })
          )
        ]
      })
      if (additionalColumn) {
        const combinedJson = items
          .map((item) => this.parseJSONColumn(item, additionalColumn))
          .flat()
          .filter(Boolean)

        if (combinedJson.length) {
          const sheetName = this.configuration?.newSheet?.name || `${sheetNamePrefix}Json`
          const aoaData = XLSX.utils.sheet_to_json(XLSX.utils.json_to_sheet(combinedJson), {
            header: 1
          })
          sheets.push({ name: sheetName, data: aoaData })
        }
      }
      const workBook = XLSX.utils.book_new()
      sheets.forEach((s, index) => {
        const sheet = XLSX.utils.aoa_to_sheet(s.data)
        XLSX.utils.book_append_sheet(workBook, sheet, s.name ?? `${sheetNamePrefix}${index + 1}`)
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
