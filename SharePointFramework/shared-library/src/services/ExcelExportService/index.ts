import * as FileSaver from 'file-saver'
import strings from 'SharedLibraryStrings'
import _ from 'underscore'
import * as XLSX from 'xlsx'
import {
  getObjectValue as get,
  getDateForExcelExport,
  stringToArrayBuffer,
  format
} from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'
import { IListColumn } from '../../types'

/**
 * Parses a raw SharePoint field value into a display-friendly string.
 * Handles user fields (pipe-separated), lookup fields (`;#`-separated),
 * and returns the value as-is for other types.
 *
 * @param value Raw field value
 */
function parseDisplayValue(value: any): any {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : parseFloat(value.toFixed(2))
  }
  if (typeof value !== 'string') return value
  if (value.includes(' | ')) {
    const match = value.match(/\|([^|]+)\|/)
    if (match) return match[1].trim()
    return value.split(' | ')[1]?.trim() || value
  }
  if (value.includes(';#')) {
    return value.split(';#')[1] || value
  }
  const numericMatch = value.match(/^#?(-?\d+(?:\.\d+)?)$/)
  if (numericMatch) {
    const num = parseFloat(numericMatch[1])
    if (!isNaN(num)) return Number.isInteger(num) ? num : parseFloat(num.toFixed(2))
  }
  return value
}

/** Excel's limits, in UTF-16 code units: what `String.length` counts and SheetJS checks. */
const MAX_CELL_TEXT_LENGTH = 32767
const MAX_SHEET_NAME_LENGTH = 31

/**
 * Cuts `value` to at most `maxLength` UTF-16 code units without splitting a surrogate pair.
 *
 * A lone surrogate is not valid UTF-8: in the browser SheetJS's own encoder then swallows the
 * next character of the XML, and the sheet can no longer be opened.
 */
function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  const last = value.charCodeAt(maxLength - 1)
  return value.slice(0, last >= 0xd800 && last <= 0xdbff ? maxLength - 1 : maxLength)
}

/** A cell value Excel can hold: text longer than Excel's limit for a cell is cut. */
function toCellValue(value: any): any {
  return typeof value === 'string' ? truncate(value, MAX_CELL_TEXT_LENGTH) : value
}

/**
 * A sheet name Excel accepts, made from `name`: the characters `: \ / ? * [ ]` become a space,
 * apostrophes and whitespace at either end go, and the name is cut to 31 characters. An empty
 * name gets `fallback`; `History` (reserved by Excel) and a name already in `usedNames`
 * (compared without case, as Excel does) get a number.
 */
function toSheetName(name: string | undefined, fallback: string, usedNames: string[]): string {
  const clean = (value: string) => value.replace(/^[\s']+|[\s']+$/g, '')
  const base =
    clean(
      truncate(clean((name ?? '').replace(/\s*[:\\/?*[\]]+\s*/g, ' ')), MAX_SHEET_NAME_LENGTH)
    ) || fallback
  const isTaken = (candidate: string) =>
    candidate.toLowerCase() === 'history' ||
    usedNames.some((used) => used.toLowerCase() === candidate.toLowerCase())
  let sheetName = base
  for (let n = 2; isTaken(sheetName); n++) {
    const suffix = ` (${n})`
    sheetName = clean(truncate(base, MAX_SHEET_NAME_LENGTH - suffix.length)) + suffix
  }
  return sheetName
}

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
  private parseMeasurementsColumn(
    item: Record<string, any>,
    column: string
  ): Record<string, any>[] {
    const value = item[column]
    if (typeof value !== 'string' || !value.trim()) return []
    const skipKeys = ['ValueDisplay', 'AchievementDisplay']
    const renameKeys = this.configuration?.measurementsSheetConfiguration?.renameKeys || {}
    const titleKey = this.configuration?.measurementsSheetConfiguration?.titleKey || 'Title'
    try {
      const parsed = JSON.parse(value)
      if (!Array.isArray(parsed)) return []
      return parsed.map((entry: any) => ({
        [titleKey]: item.Title,
        ...Object.fromEntries(
          Object.entries(entry)
            .filter(([key, val]) => typeof val !== 'object' && !skipKeys.includes(key))
            .map(([key, val]) => {
              const columnRenameConfiguration = renameKeys[key]
              const finalColumnName =
                typeof columnRenameConfiguration === 'string'
                  ? columnRenameConfiguration
                  : columnRenameConfiguration?.name || key
              let processedValue = val
              if (
                typeof columnRenameConfiguration === 'object' &&
                columnRenameConfiguration?.dataType === 'date'
              ) {
                processedValue = getDateForExcelExport(val as string | Date, false)
              } else if (key === 'Achievement' && typeof val === 'number') {
                processedValue = Math.floor(val * 100) / 100
              }
              return [finalColumnName, processedValue]
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
   * - The sheet name is taken from the configuration, made one Excel accepts (see `toSheetName`),
   *   with a fallback to `{sheetNamePrefix}1`.
   * - Text longer than an Excel cell holds (32,767 characters) is cut.
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
    columns: IListColumn[],
    fileNamePart?: string,
    sheetNamePrefix: string = 'Sheet'
  ) {
    const fileNameFormat = fileNamePart ? '{0}-{1}-{2}.xlsx' : '{0}-{1}.xlsx'
    try {
      const sheets = []
      const measurementsColumn = 'Measurements'
      const _columns = columns.filter(
        (column) => column.fieldName !== measurementsColumn && Boolean(column.name)
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
                  return parseDisplayValue(get(item, column.fieldName, null))
                }
              }
            })
          )
        ]
      })
      const hasMeasurementsColumn = items.some((item) => item[measurementsColumn])
      if (hasMeasurementsColumn) {
        const combinedJson = _.flatten(
          items.map((item) => this.parseMeasurementsColumn(item, measurementsColumn))
        ).filter(Boolean)
        if (combinedJson.length) {
          const jsonDataSheet = XLSX.utils.sheet_to_json(XLSX.utils.json_to_sheet(combinedJson), {
            header: 1
          })
          sheets.push({ name: strings.MeasurementSheetName, data: jsonDataSheet })
        }
      }
      const workBook = XLSX.utils.book_new()
      const sheetNames: string[] = []
      sheets.forEach((s, index) => {
        const sheet = XLSX.utils.aoa_to_sheet(s.data.map((row: any[]) => row.map(toCellValue)))
        const sheetName = toSheetName(s.name, `${sheetNamePrefix}${index + 1}`, sheetNames)
        sheetNames.push(sheetName)
        XLSX.utils.book_append_sheet(workBook, sheet, sheetName)
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

export { IListColumn as ExcelExportColumn }
