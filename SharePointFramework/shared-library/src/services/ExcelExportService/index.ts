import { get } from '@microsoft/sp-lodash-subset'
import * as FileSaver from 'file-saver'
import strings from 'SharedLibraryStrings'
import _ from 'underscore'
import * as XLSX from 'xlsx'
import { getDateForExcelExport, isTrueBooleanValue, stringToArrayBuffer, format } from '../../util'
import { ExcelExportServiceDefaultConfiguration } from './ExcelExportServiceDefaultConfiguration'
import { IExcelExportServiceConfiguration } from './IExcelExportServiceConfiguration'
import { IListColumn } from '../../types'

/** Numbers always show two decimals, and percentages as per cent with two decimals. */
const NUMBER_FORMAT = '#,##0.00'
const PERCENTAGE_FORMAT = '0.00%'

/** A lookup value: `id;#name`, a pair per value in a multi-lookup, `-1;#Term|guid` for a term. */
const LOOKUP_VALUE = /^-?\d+;#/
const TERM_ID = /\|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `value` rounded to `decimals` decimals, never cut: `-0.5` stays `-0.5`. */
function round(value: number, decimals = 2): number {
  return parseFloat(value.toFixed(decimals))
}

/** The number in a number or in numeric text (search returns numbers as text), or `NaN`. */
function toNumber(value: any): number {
  if (typeof value === 'number') return value
  const match = typeof value === 'string' && value.trim().match(/^#?(-?\d+(?:\.\d+)?)$/)
  return match ? parseFloat(match[1]) : NaN
}

/** The names in a lookup value, without their ids: `1;#A;#2;#B` is `A; B`. */
function parseLookupValue(value: string): string {
  return value
    .split(';#')
    .filter((_part, index) => index % 2 === 1)
    .map((name) => name.replace(TERM_ID, ''))
    .join('; ')
}

/** The names in a person value, as `UserColumn` shows them: `email | Name` is `Name`. */
function parsePersonValue(value: any): any {
  if (typeof value !== 'string' || !value.includes(' | ')) return value
  return value
    .split(';')
    .map((person) => person.split(' | ')[1]?.trim() || person.trim())
    .join('; ')
}

/**
 * A value in a column without a type of its own: a lookup as its names, numeric text as a number
 * rounded to two decimals, anything else as it is.
 */
function parseDisplayValue(value: any): any {
  if (typeof value === 'number') return round(value)
  if (typeof value !== 'string') return value
  if (LOOKUP_VALUE.test(value)) return parseLookupValue(value)
  const number = toNumber(value)
  return isNaN(number) ? value : round(number)
}

/** The data type a column is rendered with, found the way `renderItemColumn` finds it. */
function getDataType(column: IListColumn): string {
  return (column as any).dataType || column.data?.type || column.data?.renderAs
}

/**
 * The value of `column` in `item` as the list shows it: a date on the day the browser shows, a
 * Yes/No as `true`/`false` (a missing one as `false`, as the list shows it), numbers rounded to two
 * decimals (percentages to two decimals of a per cent), a person as the name. `false`, `0` and
 * `''` are values; only a missing value leaves the cell empty.
 */
function toCellValueOf(item: Record<string, any>, column: IListColumn): any {
  const value = get(item, column.fieldName) ?? null
  const dataType = getDataType(column)
  switch (dataType) {
    case 'date':
      return getDateForExcelExport(value, column.data?.dataTypeProperties?.includeTime)
    case 'boolean':
      return isTrueBooleanValue(value)
    case 'number':
    case 'currency':
    case 'percentage': {
      const number = toNumber(value)
      if (isNaN(number)) return parseDisplayValue(value)
      return round(number, dataType === 'percentage' ? 4 : 2)
    }
    case 'user':
      return parsePersonValue(value)
    default:
      return parseDisplayValue(value)
  }
}

/** The number format of a column's cells, or `undefined` for a column without one. */
function getNumberFormat(column: IListColumn): string | undefined {
  switch (getDataType(column)) {
    case 'number':
    case 'currency':
      return NUMBER_FORMAT
    case 'percentage':
      return PERCENTAGE_FORMAT
  }
}

/**
 * Gives each number cell below the header row a number format: the one for its column when
 * `formats` is a list, or `formats` itself.
 */
function setNumberFormats(sheet: XLSX.WorkSheet, formats: string | string[]) {
  if (!sheet['!ref']) return
  const range = XLSX.utils.decode_range(sheet['!ref'])
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell: XLSX.CellObject = sheet[XLSX.utils.encode_cell({ r, c })]
      const numberFormat = typeof formats === 'string' ? formats : formats[c]
      if (numberFormat && cell?.t === 'n') cell.z = numberFormat
    }
  }
}

/** `value` with each character a file name cannot hold, on Windows or macOS, made a dash. */
function toFileNamePart(value: string): string {
  return value.replace(/[\\/:*?"<>|\t\n\r]/g, '-')
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
    // `DateDisplay` is the browser's local text; `Date` is the date itself.
    const skipKeys = ['ValueDisplay', 'AchievementDisplay', 'DateDisplay']
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
              } else if (typeof val === 'number') {
                processedValue = round(val)
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
   * - Each value is written as the list shows it (see `toCellValueOf`): numbers rounded to two
   *   decimals and shown with two, dates on the browser's day, Yes/No as `true`/`false`.
   * - Text longer than an Excel cell holds (32,767 characters) is cut.
   * - The file name is taken from the configuration, with the characters a file name cannot hold
   *   made dashes.
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
          ...items.map((item) => _columns.map((column) => toCellValueOf(item, column)))
        ],
        numberFormats: _columns.map(getNumberFormat)
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
          sheets.push({
            name: strings.MeasurementSheetName,
            data: jsonDataSheet,
            numberFormats: NUMBER_FORMAT
          })
        }
      }
      const workBook = XLSX.utils.book_new()
      const sheetNames: string[] = []
      sheets.forEach((s, index) => {
        const sheet = XLSX.utils.aoa_to_sheet(s.data.map((row: any[]) => row.map(toCellValue)))
        setNumberFormats(sheet, s.numberFormats)
        const sheetName = toSheetName(s.name, `${sheetNamePrefix}${index + 1}`, sheetNames)
        sheetNames.push(sheetName)
        XLSX.utils.book_append_sheet(workBook, sheet, sheetName)
      })
      const wbout = XLSX.write(workBook, this.configuration.options)
      const name = toFileNamePart(this.configuration.name ?? '')
      const fileName = fileNamePart
        ? format(fileNameFormat, name, toFileNamePart(fileNamePart), new Date().toISOString())
        : format(fileNameFormat, name, new Date().toISOString())
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
