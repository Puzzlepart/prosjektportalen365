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
})
