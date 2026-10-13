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
import { IPortfolioAggregationContext } from '../context'
import { useExcelExport } from './useExcelExport'

/**
 * The aggregated overview's export to Excel (deliveries, risks, benefits and so on across the
 * projects): the rows the list shows, filtered as the list filters them (project refiners
 * included) and searched, or the selected rows; trend values as their achievement; the other
 * values as they are, for the export to round; the measurements sheet named after the category's
 * columns, its date from the measurement's date; and a failed export tells the user.
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
  column('GtDeliveryStatus', 'Status'),
  column('GtCost', 'Kostnad', { dataType: 'number' }),
  column('GtShare', 'Andel', { dataType: 'percentage' }),
  column('GtTrend', 'Trend', { dataType: 'trend' })
]

const items = [
  {
    Title: 'Ny bane',
    SiteTitle: 'Frisbeegolf',
    GtDeliveryStatus: 'Levert',
    GtCost: '1234.567',
    GtShare: 0.45678,
    GtTrend: '{"Achievement": 0.4567}',
    __projectRefinerValues: { GtProjectServiceArea: 'Idrett' }
  },
  {
    Title: 'Nytt basseng',
    SiteTitle: 'Svømmehall',
    GtDeliveryStatus: 'Pågår',
    GtTrend: '{}',
    __projectRefinerValues: { GtProjectServiceArea: 'Idrett' }
  },
  {
    Title: 'Nye hyller',
    SiteTitle: 'Bibliotek',
    GtDeliveryStatus: 'Levert',
    __projectRefinerValues: { GtProjectServiceArea: 'Kultur' }
  }
]

const filters = [
  {
    column: {
      key: 'GtProjectServiceArea',
      fieldName: 'GtProjectServiceArea',
      internalName: 'GtProjectServiceArea'
    }
  }
]

const allColumnsForCategory = [
  { internalName: 'Title', name: 'Gevinst' },
  { internalName: 'GtMeasurementValue', name: 'Målt verdi' },
  { internalName: 'GtMeasurementComment', name: 'Kommentar' },
  { internalName: 'MeasurementAchievement', name: 'Måloppnåelse' },
  { internalName: 'GtMeasurementDate', name: 'Måledato' }
]

const TOASTER_ID = 'excel-export-toaster'

function exportFrom(state: Record<string, any> = {}) {
  const context = {
    props: { title: 'Leveranseoversikt' },
    state: {
      items,
      columns,
      filters,
      allColumnsForCategory,
      searchTerm: '',
      activeFilters: {},
      ...state
    },
    dispatch: jest.fn(),
    toasterId: TOASTER_ID
  } as unknown as IPortfolioAggregationContext
  let exportToExcel: () => void
  const Probe: React.FC = () => {
    exportToExcel = useExcelExport(context).exportToExcel
    return null
  }
  render(
    <FluentProvider>
      <Toaster toasterId={TOASTER_ID} />
      <Probe />
    </FluentProvider>
  )
  act(() => exportToExcel())
  const [exported, exportedColumns] =
    (ExcelExportService.export as jest.Mock).mock.calls.slice(-1)[0] ?? []
  return { exported, exportedColumns }
}

const titles = (rows: Record<string, any>[]) => rows.map((row) => row.Title)

afterEach(async () => {
  cleanup()
  // The toaster keeps a timer for the toast; let it settle before the next test.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
  jest.clearAllMocks()
})

describe('useExcelExport (aggregated overview)', () => {
  it('exports the rows the list shows: filtered on the project refiners, then searched', () => {
    const filtered = exportFrom({ activeFilters: { GtProjectServiceArea: ['Idrett'] } })
    expect(titles(filtered.exported)).toEqual(['Ny bane', 'Nytt basseng'])
    expect(filtered.exportedColumns).toBe(columns)
    const searched = exportFrom({
      activeFilters: { GtProjectServiceArea: ['Idrett'] },
      searchTerm: 'svømme'
    })
    expect(titles(searched.exported)).toEqual(['Nytt basseng'])
  })

  it('exports the selected rows when there are any, whatever the search', () => {
    const { exported } = exportFrom({ searchTerm: 'svømme', selectedItems: [items[2]] })
    expect(titles(exported)).toEqual(['Nye hyller'])
  })

  it('exports a trend as its achievement, and the other values as they are', () => {
    const { exported } = exportFrom()
    expect(exported[0]).toMatchObject({ GtCost: '1234.567', GtShare: 0.45678, GtTrend: 0.4567 })
    expect(exported[1].GtTrend).toBe('')
  })

  it('names the export and the measurements sheet as it runs, the date from the measurement', () => {
    exportFrom()
    expect(ExcelExportService.configure).toHaveBeenCalledWith({
      name: 'Leveranseoversikt',
      measurementsSheetConfiguration: {
        renameKeys: {
          Title: { name: strings.MeasurementSheetTitleKey },
          Value: { name: 'Målt verdi' },
          Comment: { name: 'Kommentar' },
          Achievement: { name: 'Måloppnåelse' },
          Date: { name: 'Måledato', dataType: 'date' }
        },
        titleKey: 'Gevinst'
      }
    })
  })

  it('tells the user when the export fails', async () => {
    ;(ExcelExportService.export as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Feil i arbeidsboken')
    })
    exportFrom()
    expect(await screen.findByText(strings.ExcelExportErrorTitle)).toBeInTheDocument()
    expect(screen.getByText(strings.ExcelExportErrorMessage)).toBeInTheDocument()
  })
})
