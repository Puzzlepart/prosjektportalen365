// The section's hook reads the setup dialog's context and data, so it is mocked before the
// component is imported; the test controls the items and the selection. The group that lists
// them is the real one, so a group that stops rendering an item's text fails here.
const mockOnToggle = jest.fn()
const mockOnSearch = jest.fn()
const mockSection = { items: [] as any[], showSearch: false }
jest.mock('./useExtensionsSection', () => ({
  useExtensionsSection: () => ({
    items: mockSection.items,
    selectedKeys: new Set(['a']),
    onToggle: mockOnToggle,
    searchTerm: '',
    onSearch: mockOnSearch,
    showSearch: mockSection.showSearch,
    countText: '1 av 2 valgt',
    lockedKeys: new Set(['a'])
  })
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { ExtensionsSection } from './ExtensionsSection'

const ITEMS = [
  { key: 'a', text: 'Alfa', subText: 'Beskrivelse av Alfa' },
  { key: 'b', text: 'Bravo', subText: 'Beskrivelse av Bravo' }
]

describe('ExtensionsSection', () => {
  beforeEach(() => {
    mockSection.items = ITEMS
    mockSection.showSearch = false
    mockOnToggle.mockClear()
  })

  it('lists the items with their descriptions under its heading, and breaks no rule axe can check', async () => {
    const { container } = render(<ExtensionsSection />)
    const group = screen.getByRole('group', { name: strings.ExtensionsSectionHeaderText })
    expect(group).toHaveTextContent('Alfa')
    expect(screen.getByRole('checkbox', { name: 'Bravo' })).toHaveAccessibleDescription(
      'Beskrivelse av Bravo'
    )
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('shows the picked item as checked and reports a new pick by its key', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ExtensionsSection />)
    const bravo = screen.getByRole('checkbox', { name: 'Bravo' })
    expect(bravo).not.toBeChecked()
    await user.click(bravo)
    expect(mockOnToggle).toHaveBeenLastCalledWith('b', true)
  })

  it('marks an item that cannot be left out as required, keeps it checked and in reach of the keyboard (WCAG 1.1.1, 2.1.1, 4.1.2)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ExtensionsSection />)
    const alfa = screen.getByRole('checkbox', {
      name: (name) => name.startsWith('Alfa') && name.includes(strings.RequiredItemLabel)
    })
    expect(alfa).toBeChecked()
    expect(alfa).toHaveAttribute('aria-disabled', 'true')
    expect(alfa).not.toBeDisabled()
    expect(screen.getByTitle(strings.ExtensionLockedTooltipText)).toBeInTheDocument()
    await user.click(alfa)
    expect(mockOnToggle).not.toHaveBeenCalled()
  })

  it('tells how many are selected as a status (WCAG 4.1.3)', () => {
    render(<ExtensionsSection />)
    expect(screen.getByRole('status')).toHaveTextContent('1 av 2 valgt')
  })

  it('has no search box for a short list, and a named one that passes on what is typed for a long one', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { unmount } = render(<ExtensionsSection />)
    expect(screen.queryByRole('searchbox')).toBeNull()
    unmount()
    mockSection.showSearch = true
    render(<ExtensionsSection />)
    await user.type(
      screen.getByRole('searchbox', { name: strings.ExtensionsSectionSearchLabel }),
      'A'
    )
    expect(mockOnSearch).toHaveBeenCalledWith('A')
  })

  it('says so in plain text when there is nothing to choose, in reach of every user (WCAG 1.3.1)', () => {
    mockSection.items = []
    render(<ExtensionsSection />)
    expect(
      screen.getByRole('group', { name: strings.ExtensionsSectionHeaderText })
    ).toHaveTextContent(strings.ExtensionsSectionDisabledTooltip)
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('explains what extensions are behind a named info button (WCAG 4.1.2)', () => {
    render(<ExtensionsSection />)
    expect(
      screen.getByRole('button', {
        name: strings.AboutSectionLabel.replace('{0}', strings.ExtensionsSectionHeaderText)
      })
    ).toBeInTheDocument()
  })
})
