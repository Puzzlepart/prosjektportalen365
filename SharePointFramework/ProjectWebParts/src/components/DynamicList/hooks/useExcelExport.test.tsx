// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The workbook is the shared service's, tested there; here the
// service records what it is handed.
jest.mock('pp365-shared-library/lib/services/ExcelExportService', () => ({
  __esModule: true,
  default: { configure: jest.fn(), export: jest.fn() }
}))

import { FluentProvider, Toaster } from '@fluentui/react-components'
import { act, cleanup, render, screen } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import * as React from 'react'
import { DynamicListContext } from '../context'
import { getExportButtonText, useExcelExport } from './useExcelExport'

/**
 * The dynamic list's export to Excel: the rows the list shows (searched and filtered as the list
 * does) or the selected rows, under the web part's title or else the list's, the file named after
 * the view; the values as they are, for the export to round; a failed export ends the export and
 * tells the user. And the export button's text, which counts the selected rows in Norwegian.
 */
const listColumns = [
  { key: 'Title', fieldName: 'Title', name: 'Tittel', minWidth: 100 },
  { key: 'Status', fieldName: 'Status', name: 'Status', minWidth: 100 },
  { key: 'Cost', fieldName: 'Cost', name: 'Kostnad', minWidth: 100, dataType: 'number' }
]

const listItems = [
  { Title: 'Design av bane', Status: 'Pågår', Cost: 1234.567 },
  { Title: 'Åpning', Status: 'Ferdig', Cost: 0 },
  { Title: 'Baneplan', Status: 'Ferdig' }
]

const TOASTER_ID = 'excel-export-toaster'

function exportFrom(state: Record<string, any> = {}, props: Record<string, any> = {}) {
  const setState = jest.fn()
  const context = {
    props: { title: 'Oppgaver', ...props },
    state: {
      data: { listItems, listColumns, listTitle: 'Oppgaveliste' },
      selectedItems: [],
      activeFilters: {},
      searchTerm: '',
      ...state
    },
    setState
  } as any
  let exportToExcel: () => void
  const Probe: React.FC = () => {
    exportToExcel = useExcelExport(TOASTER_ID)
    return null
  }
  render(
    <FluentProvider>
      <Toaster toasterId={TOASTER_ID} />
      <DynamicListContext.Provider value={context}>
        <Probe />
      </DynamicListContext.Provider>
    </FluentProvider>
  )
  act(() => exportToExcel())
  const [exported, exportedColumns, fileNamePart] =
    (ExcelExportService.export as jest.Mock).mock.calls.slice(-1)[0] ?? []
  return { exported, exportedColumns, fileNamePart, setState }
}

const titles = (rows: Record<string, any>[]) => rows.map((row) => row.Title)

afterEach(async () => {
  cleanup()
  // The toaster keeps a timer for the toast; let it settle before the next test.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  jest.clearAllMocks()
})

describe('useExcelExport (dynamic list)', () => {
  it('exports the rows the list shows, with the search and the filters applied', () => {
    const searched = exportFrom({ searchTerm: 'bane' })
    expect(titles(searched.exported)).toEqual(['Design av bane', 'Baneplan'])
    expect(searched.exportedColumns).toBe(listColumns)
    const filtered = exportFrom({ searchTerm: 'bane', activeFilters: { Status: ['Ferdig'] } })
    expect(titles(filtered.exported)).toEqual(['Baneplan'])
  })

  it('exports the selected rows when there are any, whatever the search', () => {
    const { exported } = exportFrom({ searchTerm: 'bane', selectedItems: [1] })
    expect(titles(exported)).toEqual(['Åpning'])
  })

  it('hands the values over as they are, for the export to round', () => {
    const { exported } = exportFrom()
    expect(exported.map((row) => row.Cost)).toEqual([1234.567, 0, undefined])
  })

  it('names the export after the web part, or else the list, and the file after the view', () => {
    const { fileNamePart } = exportFrom({ currentView: { title: 'Mine oppgaver' } })
    expect(ExcelExportService.configure).toHaveBeenLastCalledWith({ name: 'Oppgaver' })
    expect(fileNamePart).toBe('Mine oppgaver')
    exportFrom({}, { title: ' ' })
    expect(ExcelExportService.configure).toHaveBeenLastCalledWith({ name: 'Oppgaveliste' })
  })

  it('marks the export as running, then done', () => {
    const { setState } = exportFrom()
    expect(setState.mock.calls.map(([state]) => state)).toEqual([
      { isExporting: true },
      { isExporting: false }
    ])
  })

  it('ends the export and tells the user when it fails', async () => {
    ;(ExcelExportService.export as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Feil i arbeidsboken')
    })
    const { setState } = exportFrom()
    expect(setState).toHaveBeenLastCalledWith({ isExporting: false })
    expect(await screen.findByText(strings.DynamicList.ExportErrorTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.DynamicList.ExportErrorMessage)).toBeInTheDocument()
  })
})

describe('getExportButtonText', () => {
  it('counts the selected rows in Norwegian, one and several', () => {
    expect(getExportButtonText(0)).toBe(strings.DynamicList.ExportToExcel)
    expect(getExportButtonText(1)).toBe('Eksporter 1 valgt element til Excel')
    expect(getExportButtonText(3)).toBe('Eksporter 3 valgte elementer til Excel')
  })
})
