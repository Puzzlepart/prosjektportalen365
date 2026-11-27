// The section's hook reads the setup dialog's context and data, so it is mocked before the
// component is imported; the test controls the items, the selection, the items the project has
// from an earlier run and the Planner content waiting for the group membership. The group that
// lists them is the real one.
const mockOnToggle = jest.fn()
const mockOnCheckMembership = jest.fn()
const mockSection = {
  added: new Set<string>(),
  planner: new Set<string>(),
  checking: false,
  failed: false
}
jest.mock('./useContentConfigSection', () => ({
  useContentConfigSection: () => ({
    items: [
      { key: 'a', text: 'Alfa', subText: 'Beskrivelse av Alfa' },
      { key: 'b', text: 'Bravo', subText: 'Beskrivelse av Bravo' }
    ],
    selectedKeys: new Set(['a']),
    onToggle: mockOnToggle,
    searchTerm: '',
    onSearch: jest.fn(),
    showSearch: false,
    countText: '1 av 2 valgt',
    lockedKeys: new Set(['a']),
    addedKeys: mockSection.added,
    plannerKeys: mockSection.planner,
    onCheckMembership: mockOnCheckMembership,
    isCheckingMembership: mockSection.checking,
    membershipCheckFailed: mockSection.failed
  })
}))

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'ProjectExtensionsStrings'
import * as React from 'react'
import { ContentConfigSection } from './ContentConfigSection'

describe('ContentConfigSection', () => {
  beforeEach(() => {
    mockSection.added = new Set()
    mockSection.planner = new Set()
    mockSection.checking = false
    mockSection.failed = false
    mockOnCheckMembership.mockClear()
  })

  it('lists the items with their descriptions under its heading', () => {
    render(<ContentConfigSection />)
    const group = screen.getByRole('group', { name: strings.ContentConfigSectionHeaderText })
    expect(group).toHaveTextContent('Alfa')
    expect(group).toHaveTextContent('Beskrivelse av Bravo')
    expect(screen.getByRole('status')).toHaveTextContent('1 av 2 valgt')
    expect(screen.queryByText(strings.ContentConfigAddedText)).toBeNull()
    expect(screen.queryByText(strings.ContentConfigAddedInfoText)).toBeNull()
    expect(screen.queryByText(strings.PlannerMembershipPendingMessage)).toBeNull()
  })

  it('marks the item the project has already, says why it is not selected, and breaks no rule axe can check', async () => {
    mockSection.added = new Set(['b'])
    const { container } = render(<ContentConfigSection />)
    expect(screen.getAllByText(strings.ContentConfigAddedText)).toHaveLength(1)
    expect(screen.getByText(strings.ContentConfigAddedInfoText)).toBeInTheDocument()
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('reports a new pick by its key, and marks what cannot be left out as required', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(<ContentConfigSection />)
    expect(screen.getByTitle(strings.ContentConfigLockedTooltipText)).toHaveTextContent(
      strings.RequiredItemLabel
    )
    await user.click(screen.getByRole('checkbox', { name: 'Bravo' }))
    expect(mockOnToggle).toHaveBeenLastCalledWith('b', true)
  })

  it('says on the Planner content that the group membership is not registered, and asks again on request', async () => {
    mockSection.planner = new Set(['b'])
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    const { container } = render(<ContentConfigSection />)
    expect(screen.getAllByText(strings.PlannerMembershipPendingMessage)).toHaveLength(1)
    await user.click(
      screen.getByRole('button', { name: strings.PlannerMembershipRecheckButtonText })
    )
    expect(mockOnCheckMembership).toHaveBeenCalledTimes(1)
    expect(await axeComponent(container)).toHaveNoViolations()
  })

  it('says so when the membership was asked for again and is still not registered', () => {
    mockSection.planner = new Set(['b'])
    mockSection.failed = true
    render(<ContentConfigSection />)
    expect(
      screen.getByText((text) => text.includes(strings.PlannerMembershipStillPendingText))
    ).toBeInTheDocument()
  })
})
