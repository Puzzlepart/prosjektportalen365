import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { FilterPanel, IFilterProps } from '.'

const PHASE = { key: 'GtProjectPhase', fieldName: 'GtProjectPhase', name: 'Fase' } as any
const SERVICE = { key: 'GtServiceArea', fieldName: 'GtServiceArea', name: 'Tjenesteområde' } as any
const PROGRAM = {
  key: 'GtIsProgram',
  fieldName: 'GtIsProgram',
  name: 'Program',
  data: { renderAs: 'boolean' }
} as any
const TAGS = { key: 'GtTags', fieldName: 'GtTags', name: 'Stikkord', dataType: 'tags' } as any

function filter(column: any, values: string[], extra: Partial<IFilterProps> = {}): IFilterProps {
  return { column, items: values.map((value) => ({ name: value, value })), ...extra }
}

function renderPanel(filters: IFilterProps[]) {
  const onFilterChange = jest.fn()
  render(
    <FilterPanel
      open
      headerText='Filtre'
      filters={filters}
      onFilterChange={onFilterChange}
      onClose={jest.fn()}
    />
  )
  return onFilterChange
}

// `hidden: true` finds the checkboxes of a folded filter too.
const checkbox = (label: string) => screen.getByRole('checkbox', { name: label, hidden: true })

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('FilterPanel', () => {
  it('says so when there is nothing to filter on', () => {
    renderPanel([filter(PHASE, ['Konsept'])])
    expect(screen.getByText(strings.FilterPanelEmptyTitle)).toBeInTheDocument()
    expect(screen.queryByText('Fase')).toBeNull()
  })

  it('shows the filters with more than one value, the grouped ones under their group', () => {
    renderPanel([
      filter(SERVICE, ['Helse', 'Skole'], { group: 'Prosjektinformasjon' }),
      filter(PHASE, ['Konsept', 'Gjennomføring']),
      filter(TAGS, ['Ensom'])
    ])
    const heading = screen.getByRole('heading', { name: 'Prosjektinformasjon' })
    expect(heading).toBeInTheDocument()
    const sections = screen.getAllByText(/^(Fase|Tjenesteområde|Prosjektinformasjon)$/)
    expect(sections.map((node) => node.textContent)).toEqual([
      'Fase',
      'Prosjektinformasjon',
      'Tjenesteområde'
    ])
    expect(screen.queryByText('Stikkord')).toBeNull()
  })

  it('reports the values picked in a filter', () => {
    const onFilterChange = renderPanel([filter(PHASE, ['Konsept', 'Gjennomføring'])])
    fireEvent.click(checkbox('Gjennomføring'))
    expect(onFilterChange).toHaveBeenLastCalledWith(PHASE, [
      expect.objectContaining({ value: 'Gjennomføring', selected: true })
    ])
    fireEvent.click(checkbox('Konsept'))
    expect(onFilterChange.mock.calls[1][1].map(({ value }) => value)).toEqual([
      'Konsept',
      'Gjennomføring'
    ])
    fireEvent.click(checkbox('Gjennomføring'))
    expect(onFilterChange.mock.calls[2][1].map(({ value }) => value)).toEqual(['Konsept'])
  })

  it('folds a filter away and out again from its header', () => {
    // The panel's drawer never finishes its entry animation under jsdom, so the fold is read
    // from the hidden attribute rather than from visibility.
    renderPanel([filter(PHASE, ['Konsept', 'Gjennomføring'], { defaultCollapsed: true })])
    expect(checkbox('Konsept').closest('[hidden]')).not.toBeNull()
    fireEvent.click(screen.getByText('Fase'))
    expect(checkbox('Konsept').closest('[hidden]')).toBeNull()
  })

  it('names the values of a yes/no column', () => {
    renderPanel([filter(PROGRAM, ['1', '0'])])
    expect(checkbox(strings.BooleanYes)).toBeInTheDocument()
    expect(checkbox(strings.BooleanNo)).toBeInTheDocument()
  })

  it("uses a yes/no column's own names for its values", () => {
    const custom = {
      ...PROGRAM,
      data: {
        renderAs: 'boolean',
        dataTypeProperties: { valueIfTrue: 'Program', valueIfFalse: 'Prosjekt' }
      }
    }
    renderPanel([filter(custom, ['true', 'false'])])
    expect(checkbox('Program')).toBeInTheDocument()
    expect(checkbox('Prosjekt')).toBeInTheDocument()
  })

  it('shows term paths as a tree, where a parent filters its whole branch', () => {
    const onFilterChange = renderPanel([
      filter(TAGS, ['Helse:Sykehjem', 'Helse:Legevakt', 'Skole'])
    ])
    // Every branch is open from the start.
    expect(checkbox('Sykehjem')).toBeInTheDocument()
    fireEvent.click(checkbox('Sykehjem'))
    expect(onFilterChange).toHaveBeenLastCalledWith(TAGS, [
      expect.objectContaining({ name: 'Sykehjem', value: 'Helse:Sykehjem', selected: true })
    ])
    // A parent with a selected child shows as partly selected.
    expect(checkbox('Helse')).toBePartiallyChecked()
    fireEvent.click(checkbox('Helse'))
    expect(onFilterChange.mock.calls[1][1].map(({ value }) => value)).toEqual([
      'Helse:Sykehjem',
      'Helse'
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Helse' }))
    expect(screen.queryByRole('checkbox', { name: 'Sykehjem' })).toBeNull()
  })
})
