// The sections come from the report's data, so the hook is mocked before the component is
// imported. Fluent's overflow needs a ResizeObserver, which jsdom lacks; a no-op keeps it quiet.
const mockSections: { value: any[] } = { value: [] }
const SECTIONS = [
  { id: 1, name: 'Sammendrag' },
  { id: 2, name: 'Leveranser' },
  { id: 3, name: 'Usikkerhet' }
]
jest.mock('../Sections/useSections', () => ({ useSections: () => mockSections.value }))
window.ResizeObserver =
  window.ResizeObserver ??
  (class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any)

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'ProjectWebPartsStrings'
import { SectionTabs } from './SectionTabs'

// jsdom has no layout and no `scrollIntoView`; the test only needs to see it asked for.
Element.prototype.scrollIntoView = jest.fn()

/**
 * The status report's section tabs: one tab per section, named after it, and choosing one scrolls
 * that section into view. Asserted through the tab role and the scroll request, so it holds
 * whichever element keeps the tabs pinned while the report scrolls.
 */
describe('SectionTabs', () => {
  beforeEach(() => {
    mockSections.value = SECTIONS
  })

  it('shows a tab for every section', () => {
    render(<SectionTabs />)
    expect(screen.getByRole('tab', { name: 'Sammendrag' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Leveranser' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Usikkerhet' })).toBeInTheDocument()
  })

  it('scrolls the chosen section into view', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 })
    render(
      <>
        <SectionTabs />
        <div id={`${strings.ListSectionElementIdPrefix}2`}>Leveranser-seksjonen</div>
      </>
    )
    await user.click(screen.getByRole('tab', { name: 'Leveranser' }))
    const section = screen.getByText('Leveranser-seksjonen')
    expect(section.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('gives the placeholder sections of a loading report no tab', () => {
    // While the report loads, the sections are placeholders without an id or a name.
    mockSections.value = [
      { id: undefined, name: undefined },
      { id: undefined, name: undefined }
    ]
    render(<SectionTabs />)
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
  })
})
