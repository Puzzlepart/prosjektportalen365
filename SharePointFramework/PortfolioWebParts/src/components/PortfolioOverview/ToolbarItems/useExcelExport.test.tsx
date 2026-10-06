// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The workbook is the shared service's, tested there; here the
// service records what it is handed.
jest.mock('pp365-shared-library/lib/services/ExcelExportService', () => ({
  __esModule: true,
  default: { configure: jest.fn(), export: jest.fn() }
}))

import { FluentProvider, Toaster } from '@fluentui/react-components'
import { act, cleanup, render, screen } from '@testing-library/react'
import strings from 'PortfolioWebPartsStrings'
import ExcelExportService from 'pp365-shared-library/lib/services/ExcelExportService'
import * as React from 'react'
import { IPortfolioOverviewContext } from '../context'
import { EXCEL_EXPORT_ERROR, EXCEL_EXPORT_SUCCESS, START_EXCEL_EXPORT } from '../reducer'
import { useExcelExport } from './useExcelExport'

/**
 * The portfolio overview's export to Excel: the rows the list shows (the search and the filters
 * applied) or the selected rows, under the web part's name and, when asked, the view's; the values
 * as they are, for the export to round; and a failed export ends the export and tells the user.
 */
const column = (fieldName: string, name: string, extra: Record<string, any> = {}) => ({
  key: fieldName,
  fieldName,
  name,
  minWidth: 100,
  dataType: 'text',
  ...extra
})

const columns = [
  column('Title', 'Tittel'),
  column('GtProjectPhase', 'Fase'),
  column('GtBudgetTotal', 'Budsjett', { dataType: 'currency' })
]

const items = [
  { Title: 'Alfa', GtProjectPhase: 'Konsept', GtBudgetTotal: '1234.567' },
  { Title: 'Bravo', GtProjectPhase: 'Planlegge' },
  { Title: 'Charlie konsept', GtProjectPhase: 'Realisere' }
]

const TOASTER_ID = 'excel-export-toaster'

function exportFrom(state: Record<string, any> = {}, props: Record<string, any> = {}) {
  const dispatch = jest.fn()
  const context = {
    props: { title: 'Porteføljeoversikt', configuration: { refiners: [] }, ...props },
    state: { items, columns, searchTerm: '', activeFilters: {}, ...state },
    dispatch,
    toasterId: TOASTER_ID
  } as unknown as IPortfolioOverviewContext
  let exportToExcel: () => void
  const Probe: React.FC = () => {
    exportToExcel = useExcelExport(context)
    return null
  }
  render(
    <FluentProvider>
      <Toaster toasterId={TOASTER_ID} />
      <Probe />
    </FluentProvider>
  )
  act(() => exportToExcel())
  const [exported, exportedColumns, fileNamePart] =
    (ExcelExportService.export as jest.Mock).mock.calls.slice(-1)[0] ?? []
  return {
    actions: dispatch.mock.calls.map(([action]) => action.type),
    exported,
    exportedColumns,
    fileNamePart
  }
}

const titles = (rows: Record<string, any>[]) => rows.map((row) => row.Title)

afterEach(async () => {
  cleanup()
  // The toaster keeps a timer for the toast; let it settle before the next test.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  jest.clearAllMocks()
})

describe('useExcelExport (portfolio overview)', () => {
  it('exports the rows the list shows, with the search and the filters applied', () => {
    // The reducer lowercases the term before it reaches the state.
    const searched = exportFrom({ searchTerm: 'konsept' })
    expect(titles(searched.exported)).toEqual(['Alfa', 'Charlie konsept'])
    expect(searched.exportedColumns).toBe(columns)
    const filtered = exportFrom({
      searchTerm: 'konsept',
      activeFilters: { GtProjectPhase: ['Realisere'] }
    })
    expect(titles(filtered.exported)).toEqual(['Charlie konsept'])
  })

  it('exports the selected rows when there are any, whatever the search', () => {
    const { exported } = exportFrom({ searchTerm: 'konsept', selectedItems: [items[1]] })
    expect(titles(exported)).toEqual(['Bravo'])
  })

  it('hands the values over as they are, for the export to round', () => {
    const { exported } = exportFrom()
    expect(exported[0].GtBudgetTotal).toBe('1234.567')
  })

  it('names the export after the web part as it runs, and the file after the view when asked', () => {
    const { fileNamePart } = exportFrom(
      { currentView: { title: 'Mine prosjekter' } },
      { includeViewNameInExcelExportFilename: true }
    )
    expect(ExcelExportService.configure).toHaveBeenCalledWith({ name: 'Porteføljeoversikt' })
    expect(fileNamePart).toBe('Mine prosjekter')
  })

  it('marks the export as running, then done', () => {
    expect(exportFrom().actions).toEqual([START_EXCEL_EXPORT.type, EXCEL_EXPORT_SUCCESS.type])
  })

  it('ends the export and tells the user when it fails', async () => {
    ;(ExcelExportService.export as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Feil i arbeidsboken')
    })
    expect(exportFrom().actions).toEqual([START_EXCEL_EXPORT.type, EXCEL_EXPORT_ERROR.type])
    expect(await screen.findByText(strings.ExcelExportErrorTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.ExcelExportErrorMessage)).toBeInTheDocument()
  })
})
