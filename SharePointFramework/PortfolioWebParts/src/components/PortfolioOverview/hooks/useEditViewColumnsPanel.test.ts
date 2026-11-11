import { renderHook } from '@testing-library/react'
import { useEditViewColumnsPanel } from './useEditViewColumnsPanel'

/**
 * The portfolio overview's «Vis eller skjul kolonner»: it offers the columns of the list as they
 * are now, though the configuration is the list as the page loaded it.
 */
const column = (id: number, name: string) => ({
  id,
  key: `Kolonne${id}`,
  fieldName: `Kolonne${id}`,
  name,
  sortOrder: id * 10,
  data: {} as Record<string, any>,
  setData(data: Record<string, any>) {
    this.data = { ...this.data, ...data }
    return this
  }
})

describe('useEditViewColumnsPanel (portfolio overview)', () => {
  it('offers a column added since the page loaded, and not one deleted since', () => {
    // The panel listed the deleted column, and left the added one out, so «Bruk» took the added
    // column out of the view.
    const [title, phase, budget] = [column(1, 'Tittel'), column(2, 'Fase'), column(3, 'Budsjett')]
    const added = column(99, 'Ny kolonne')
    const context = {
      props: { configuration: { columns: [title, phase, budget] } },
      state: {
        isEditViewColumnsPanelOpen: true,
        columns: [title, added],
        currentView: { id: 1, columnOrder: [] },
        deletedColumnIds: [3]
      },
      dispatch: jest.fn()
    } as any
    const { result } = renderHook(() => useEditViewColumnsPanel(context))
    expect(result.current.columns.map((c: any) => [c.id, c.data.isSelected])).toEqual([
      [1, true],
      [2, false],
      [99, true]
    ])
  })

  it('offers a column edited since the page loaded as it is now', () => {
    // «Bruk» put the column back in the view as it was before the edit.
    const context = {
      props: { configuration: { columns: [column(1, 'Tittel'), column(2, 'Fase')] } },
      state: { columns: [column(2, 'Prosjektfase')], currentView: { id: 1, columnOrder: [] } },
      dispatch: jest.fn()
    } as any
    const { result } = renderHook(() => useEditViewColumnsPanel(context))
    expect(result.current.columns.map((c: any) => c.name)).toEqual(['Tittel', 'Prosjektfase'])
  })
})
