// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The file is not saved; `saveAs` records its name.
jest.mock('file-saver', () => ({ saveAs: jest.fn() }))

import * as FileSaver from 'file-saver'
import strings from 'SharedLibraryStrings'
import * as XLSX from 'xlsx'
import ExcelExportService from '.'

/** The sheets the export built, by name, each as rows of cells. */
function exported() {
  const sheets: Record<string, any[][]> = {}
  const toSheet = jest.spyOn(XLSX.utils, 'aoa_to_sheet')
  const append = jest.spyOn(XLSX.utils, 'book_append_sheet')
  return {
    sheets: () => {
      append.mock.calls.forEach(
        ([, , name], index) => (sheets[name] = toSheet.mock.calls[index][0] as any[][])
      )
      return sheets
    }
  }
}

/** The bytes of the file the export handed to `saveAs`. */
async function savedBytes(): Promise<Uint8Array> {
  const [blob] = (FileSaver.saveAs as jest.Mock).mock.calls[0]
  // jsdom's Blob has no arrayBuffer(); FileReader is the API it implements.
  const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
  return new Uint8Array(bytes)
}

/** The workbook in the file the export handed to `saveAs`, read back from the Blob's bytes. */
async function savedWorkbook(): Promise<XLSX.WorkBook> {
  return XLSX.read(await savedBytes(), { type: 'array' })
}

/**
 * The XML parts of the saved file that a strict XML parser rejects, and its main content type.
 * SheetJS reads back files that Excel refuses, so the cells alone do not prove the file opens.
 */
async function savedPackage(): Promise<{ contentTypes: string; malformedParts: string[] }> {
  const zip = XLSX.CFB.read(await savedBytes(), { type: 'array' })
  const parts: Record<string, string> = {}
  zip.FullPaths.forEach((fullPath: string, index: number) => {
    const path = fullPath.replace(/^Root Entry\//, '')
    if (!/\.(xml|rels)$/.test(path)) return
    let binary = ''
    Array.from<number>(zip.FileIndex[index].content).forEach(
      (byte) => (binary += String.fromCharCode(byte))
    )
    // Throws on bytes that are not UTF-8.
    parts[path] = decodeURIComponent(escape(binary))
  })
  const isMalformed = (xml: string) =>
    new DOMParser().parseFromString(xml, 'application/xml').getElementsByTagName('parsererror')
      .length > 0
  return {
    contentTypes: parts['[Content_Types].xml'],
    malformedParts: Object.keys(parts).filter((path) => isMalformed(parts[path]))
  }
}

/** A sheet's cells row by row over its range, as type and value, `null` where none was written. */
function cells(sheet: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(sheet['!ref'])
  const rows = []
  for (let r = range.s.r; r <= range.e.r; r++) {
    const row = []
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell: XLSX.CellObject = sheet[XLSX.utils.encode_cell({ r, c })]
      row.push(cell ? { t: cell.t, v: cell.v } : null)
    }
    rows.push(row)
  }
  return rows
}

/** A text cell as SheetJS reads it back. */
function text(v: string) {
  return { t: 's', v }
}

/** A number cell as SheetJS reads it back. */
function num(v: number) {
  return { t: 'n', v }
}

/** A boolean cell as SheetJS reads it back. */
function bool(v: boolean) {
  return { t: 'b', v }
}

const COLUMNS = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel' },
  { key: 'GtBudget', fieldName: 'GtBudget', name: 'Budsjett' },
  { key: 'GtStatus', fieldName: 'GtStatus', name: 'Status' },
  { key: 'GtPhase', fieldName: 'GtPhase', name: 'Fase' },
  { key: 'GtCode', fieldName: 'GtCode', name: 'Kode' },
  { key: 'GtStart', fieldName: 'GtStart', name: 'Start', dataType: 'date' },
  {
    key: 'GtUpdated',
    fieldName: 'GtUpdated',
    name: 'Oppdatert',
    dataType: 'date',
    data: { dataTypeProperties: { includeTime: true } }
  },
  { key: 'GtHidden', fieldName: 'GtHidden', name: '' },
  { key: 'Measurements', fieldName: 'Measurements', name: 'Målinger' }
] as any[]

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-10-02T12:00:00Z'))
  ExcelExportService.configure({ name: 'Porteføljeoversikt' } as any)
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
  ;(FileSaver.saveAs as jest.Mock).mockClear()
})

describe('ExcelExportService', () => {
  it('exports the named columns, with the values as they are shown', () => {
    const result = exported()
    ExcelExportService.export(
      [
        {
          Title: 'Frisbeegolfbane',
          GtBudget: 1234.567,
          GtStatus: 'Grønn | Ihht. plan | 2',
          GtPhase: '3;#Gjennomføring',
          GtCode: '#7.5',
          GtStart: '2026-03-01T00:00:00Z',
          GtUpdated: '2026-09-30T10:15:00Z'
        },
        { Title: 'Svømmehall', GtBudget: 500, GtStatus: 'Gul | Avvik', GtCode: 'Ikke et tall' }
      ],
      COLUMNS
    )
    expect(result.sheets()['Porteføljeoversikt']).toEqual([
      ['Tittel', 'Budsjett', 'Status', 'Fase', 'Kode', 'Start', 'Oppdatert'],
      [
        'Frisbeegolfbane',
        1234.57,
        'Ihht. plan',
        'Gjennomføring',
        7.5,
        '2026-03-01',
        '2026-09-30T10:15:00.000Z'
      ],
      ['Svømmehall', 500, 'Avvik', null, 'Ikke et tall', '', '']
    ])
  })

  it('names the file after the export and the time, with the part it is given', () => {
    ExcelExportService.export([{ Title: 'A' }], COLUMNS)
    expect((FileSaver.saveAs as jest.Mock).mock.calls[0][1]).toBe(
      'Porteføljeoversikt-2026-10-02T12:00:00.000Z.xlsx'
    )
    ExcelExportService.export([{ Title: 'A' }], COLUMNS, 'Alle prosjekter')
    expect((FileSaver.saveAs as jest.Mock).mock.calls[1][1]).toBe(
      'Porteføljeoversikt-Alle prosjekter-2026-10-02T12:00:00.000Z.xlsx'
    )
  })

  it('adds a sheet of the measurements, named and typed as configured', () => {
    ExcelExportService.configure({
      name: 'Gevinstoversikt',
      measurementsSheetConfiguration: {
        titleKey: 'Prosjekt',
        renameKeys: { Value: 'Verdi', Date: { name: 'Dato', dataType: 'date' } }
      }
    } as any)
    const result = exported()
    ExcelExportService.export(
      [
        {
          Title: 'Frisbeegolfbane',
          Measurements: JSON.stringify([
            {
              Value: 5,
              ValueDisplay: '5 stk',
              Date: '2026-01-31T00:00:00Z',
              Achievement: 0.4567,
              Details: {}
            }
          ])
        }
      ],
      COLUMNS
    )
    const sheets = result.sheets()
    expect(Object.keys(sheets)).toEqual(['Gevinstoversikt', strings.MeasurementSheetName])
    expect(sheets[strings.MeasurementSheetName]).toEqual([
      ['Prosjekt', 'Verdi', 'Dato', 'Achievement'],
      ['Frisbeegolfbane', 5, '2026-01-31', 0.45]
    ])
  })

  it('stops on measurements that are not JSON', () => {
    expect(() =>
      ExcelExportService.export([{ Title: 'A', Measurements: '{ ikke json' }], COLUMNS)
    ).toThrow('Error parsing JSON in column "Measurements"')
  })

  it('saves an xlsx file that reads back with each value and its type, and dates as text', async () => {
    ExcelExportService.export(
      [
        {
          Title: 'Frisbeegolfbane på Ekeberg',
          GtBudget: 1234.567,
          GtStatus: 'Grønn | Ihht. plan | 2',
          GtPhase: '3;#Gjennomføring',
          GtCode: '#7.5',
          GtStart: '2026-03-01T00:00:00Z',
          GtUpdated: '2026-09-30T10:15:00Z',
          GtIsParent: true,
          GtNote: 'Mål & tiltak: <fase 1>\n"Ferdig" før jul'
        },
        {
          Title: 'Svømmehall',
          GtBudget: -500,
          GtStatus: 'Gul | Avvik',
          GtCode: 'Ikke et tall',
          GtIsParent: false,
          GtNote: ''
        },
        { Title: 'Bibliotek', GtBudget: 0, GtCode: '#-3' }
      ],
      [
        ...COLUMNS,
        { key: 'GtIsParent', fieldName: 'GtIsParent', name: 'Overordnet', dataType: 'boolean' },
        { key: 'GtNote', fieldName: 'GtNote', name: 'Merknad', dataType: 'note' }
      ]
    )
    const [blob] = (FileSaver.saveAs as jest.Mock).mock.calls[0]
    expect(blob.type).toBe('application/octet-stream')
    const workbook = await savedWorkbook()
    expect(workbook.SheetNames).toEqual(['Porteføljeoversikt'])
    // A missing value, false, 0 and '' leave no cell: the value is read with getObjectValue, which
    // falls back on every falsy value. A missing date is written as an empty text.
    expect(cells(workbook.Sheets['Porteføljeoversikt'])).toEqual([
      [
        text('Tittel'),
        text('Budsjett'),
        text('Status'),
        text('Fase'),
        text('Kode'),
        text('Start'),
        text('Oppdatert'),
        text('Overordnet'),
        text('Merknad')
      ],
      [
        text('Frisbeegolfbane på Ekeberg'),
        num(1234.57),
        text('Ihht. plan'),
        text('Gjennomføring'),
        num(7.5),
        text('2026-03-01'),
        text('2026-09-30T10:15:00.000Z'),
        bool(true),
        text('Mål & tiltak: <fase 1>\n"Ferdig" før jul')
      ],
      [
        text('Svømmehall'),
        num(-500),
        text('Avvik'),
        null,
        text('Ikke et tall'),
        text(''),
        text(''),
        null,
        null
      ],
      [text('Bibliotek'), null, null, null, num(-3), text(''), text(''), null, null]
    ])
  })

  it('saves the measurements sheet after the main sheet, with empty cells where a value is missing', async () => {
    ExcelExportService.configure({
      name: 'Gevinstoversikt',
      measurementsSheetConfiguration: {
        titleKey: 'Prosjekt',
        renameKeys: {
          Title: { name: 'Måling' },
          Value: { name: 'Verdi' },
          Comment: { name: 'Kommentar' },
          Achievement: { name: 'Måloppnåelse' },
          DateDisplay: { name: 'Dato', dataType: 'date' }
        }
      }
    } as any)
    ExcelExportService.export(
      [
        {
          Title: 'Frisbeegolfbane',
          Measurements: JSON.stringify([
            {
              Title: 'Antall brukere',
              Value: 120,
              ValueDisplay: '120,00',
              Comment: 'Over forventet',
              Achievement: 45.6789,
              AchievementDisplay: '45,68%',
              DateDisplay: '2026-01-31T00:00:00Z',
              TrendIcon: { iconName: 'CaretUp', color: '#27ae60' }
            },
            {
              Title: 'Antall brukere',
              Value: 0,
              Achievement: -12.5,
              DateDisplay: '2025-12-31T00:00:00Z'
            }
          ])
        },
        {
          Title: 'Svømmehall',
          Measurements: JSON.stringify([
            {
              Title: 'Besøk per uke',
              Value: null,
              Comment: '',
              Achievement: 100,
              DateDisplay: 'ikke en dato'
            }
          ])
        },
        { Title: 'Bibliotek' },
        { Title: 'Kulturhus', Measurements: '[]' }
      ],
      COLUMNS
    )
    const workbook = await savedWorkbook()
    expect(workbook.SheetNames).toEqual(['Gevinstoversikt', strings.MeasurementSheetName])
    expect(cells(workbook.Sheets[strings.MeasurementSheetName])).toEqual([
      [
        text('Prosjekt'),
        text('Måling'),
        text('Verdi'),
        text('Kommentar'),
        text('Måloppnåelse'),
        text('Dato')
      ],
      [
        text('Frisbeegolfbane'),
        text('Antall brukere'),
        num(120),
        text('Over forventet'),
        num(45.67),
        text('2026-01-31')
      ],
      [
        text('Frisbeegolfbane'),
        text('Antall brukere'),
        num(0),
        null,
        num(-12.5),
        text('2025-12-31')
      ],
      [text('Svømmehall'), text('Besøk per uke'), null, text(''), num(100), text('')]
    ])
  })

  it('saves only the header row when there are no items', async () => {
    ExcelExportService.export([], COLUMNS)
    const workbook = await savedWorkbook()
    expect(workbook.SheetNames).toEqual(['Porteføljeoversikt'])
    expect(cells(workbook.Sheets['Porteføljeoversikt'])).toEqual([
      [
        text('Tittel'),
        text('Budsjett'),
        text('Status'),
        text('Fase'),
        text('Kode'),
        text('Start'),
        text('Oppdatert')
      ]
    ])
  })

  it('names the sheet Sheet1 when the export has an empty name', async () => {
    ExcelExportService.configure({ name: '' } as any)
    ExcelExportService.export([{ Title: 'Frisbeegolfbane' }], COLUMNS)
    const workbook = await savedWorkbook()
    expect(workbook.SheetNames).toEqual(['Sheet1'])
  })

  it('saves an xlsx package whose XML parts are all well-formed', async () => {
    ExcelExportService.export(
      [
        {
          Title: 'Frisbeegolfbane',
          GtBudget: 5,
          GtStatus: 'Grønn | Ihht. plan',
          GtCode: 'x'.repeat(40000)
        }
      ],
      COLUMNS
    )
    const { contentTypes, malformedParts } = await savedPackage()
    expect(contentTypes).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml'
    )
    expect(malformedParts).toEqual([])
  })

  it.each([
    ['Status: 2026/27 [utkast]?', 'Status 2026 27 utkast'],
    ["'Mine prosjekter'", 'Mine prosjekter'],
    ['History', 'History (2)'],
    ['Kommunikasjonsplaner for underområder', 'Kommunikasjonsplaner for undero'],
    ['a'.repeat(30) + '\u{1F600}', 'a'.repeat(30)],
    ['', 'Sheet1'],
    [':', 'Sheet1']
  ])('names the sheet of %j %j, a name Excel accepts', async (name, sheetName) => {
    ExcelExportService.configure({ name } as any)
    ExcelExportService.export([{ Title: 'Frisbeegolfbane' }], COLUMNS)
    expect((await savedWorkbook()).SheetNames).toEqual([sheetName])
  })

  it('numbers the measurements sheet when the export has the same name', async () => {
    ExcelExportService.configure({ name: strings.MeasurementSheetName.toUpperCase() } as any)
    ExcelExportService.export(
      [{ Title: 'Frisbeegolfbane', Measurements: JSON.stringify([{ Value: 1 }]) }],
      COLUMNS
    )
    expect((await savedWorkbook()).SheetNames).toEqual([
      strings.MeasurementSheetName.toUpperCase(),
      `${strings.MeasurementSheetName} (2)`
    ])
  })

  it('cuts text to the 32,767 characters a cell holds, without splitting a character', async () => {
    ExcelExportService.export(
      [
        {
          Title: 'x'.repeat(32766) + '\u{1F600}y',
          Measurements: JSON.stringify([{ Comment: 'k'.repeat(40000) }])
        }
      ],
      COLUMNS
    )
    const workbook = await savedWorkbook()
    expect(workbook.Sheets['Porteføljeoversikt'].A2).toMatchObject(text('x'.repeat(32766)))
    expect(workbook.Sheets[strings.MeasurementSheetName].B2).toMatchObject(text('k'.repeat(32767)))
  })
})
