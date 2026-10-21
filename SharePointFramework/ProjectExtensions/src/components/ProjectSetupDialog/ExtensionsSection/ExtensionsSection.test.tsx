// The section's hook reads the setup dialog's context and data, so it is mocked before the
// component is imported; the test controls the items and the selection. The columns are the real
// ones, so a column that stops rendering its text fails here.
const mockOnSelectionChange = jest.fn()
const mockOnSearch = jest.fn()
jest.mock('./useExtensionsSection', () => ({
  useExtensionsSection: () => ({
    items: [
      { key: 'a', text: 'Alfa', subText: 'Beskrivelse av Alfa' },
      { key: 'b', text: 'Bravo', subText: 'Beskrivelse av Bravo' }
    ],
    columns: jest.requireActual('./useColumns').useColumns(new Set(['a'])),
    selectedRowIds: new Set(['a']),
    onSelectionChange: mockOnSelectionChange,
    searchTerm: '',
    onSearch: mockOnSearch,
    toolbarItems: [],
    selectedCountText: '1 valgte elementer'
  })
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { ExtensionsSection } from './ExtensionsSection'

/**
 * The project setup section that lists what can be picked: rows with a description, the picked
 * ones checked, a new pick reported as the ids now selected, and the search box wired to the hook.
 */
describe('ExtensionsSection', () => {
  it('lists the items with their descriptions', () => {
    render(<ExtensionsSection />)
    expect(screen.getByText('Alfa')).toBeInTheDocument()
    expect(screen.getByText('Beskrivelse av Bravo')).toBeInTheDocument()
  })

  it('shows the picked item as checked and reports a new pick by id', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ExtensionsSection />)
    // The first checkbox selects all; the rest are one per row, in row order.
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[1]).toBeChecked()
    expect(checkboxes[2]).not.toBeChecked()
    await user.click(checkboxes[2])
    expect(mockOnSelectionChange).toHaveBeenLastCalledWith(['a', 'b'])
  })

  it('names its search box, and the lock on an item that cannot be left out (WCAG 1.1.1, 4.1.2)', () => {
    render(<ExtensionsSection />)
    expect(
      screen.getByRole('searchbox', { name: strings.ExtensionsSectionSearchLabel })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: strings.ExtensionLockedTooltipText })
    ).toBeInTheDocument()
  })

  it('tells how many are selected as a status, not as a button (WCAG 4.1.2, 4.1.3)', async () => {
    const { container } = render(<ExtensionsSection />)
    expect(screen.getByRole('status')).toHaveTextContent('1 valgte elementer')
    expect(screen.queryByRole('button', { name: '1 valgte elementer' })).toBeNull()
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('passes what is typed to the search', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ExtensionsSection />)
    await user.type(screen.getByRole('searchbox'), 'A')
    expect(mockOnSearch).toHaveBeenCalledWith('A')
  })
})
