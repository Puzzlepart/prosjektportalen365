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

import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as React from 'react'
import strings from 'ProjectWebPartsStrings'
import { SectionTabs } from './SectionTabs'

// jsdom has no layout and no `scrollIntoView`; the test only needs to see it asked for.
Element.prototype.scrollIntoView = jest.fn()
const scrollIntoView = Element.prototype.scrollIntoView as jest.Mock

/** The sections asked to scroll into view, in order, by their text. */
const scrolled = () => scrollIntoView.mock.contexts.map((element: Element) => element.textContent)

/** The report with the given sections below the tabs. */
const renderReport = (...ids: number[]) =>
  render(
    <>
      <SectionTabs />
      {ids.map((id) => (
        <div key={id} id={`${strings.ListSectionElementIdPrefix}${id}`}>
          Seksjon {id}
        </div>
      ))}
    </>
  )

/**
 * The status report's section tabs: one tab per section, named after it, and choosing one scrolls
 * that section into view. Asserted through the tab role and the scroll request, so it holds
 * whichever element keeps the tabs pinned while the report scrolls.
 */
describe('SectionTabs', () => {
  beforeEach(() => {
    mockSections.value = SECTIONS
    scrollIntoView.mockClear()
  })

  afterEach(() => jest.useRealTimers())

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

  it('scrolls on to the section once the scrolling has ended, wherever it ended', () => {
    // SharePoint's header collapsing mid-scroll stops a smooth scroll short of the section.
    renderReport(1, 2, 3)
    fireEvent.click(screen.getByRole('tab', { name: 'Usikkerhet' }))
    expect(scrolled()).toEqual(['Seksjon 3'])
    fireEvent(document, new Event('scrollend'))
    expect(scrolled()).toEqual(['Seksjon 3', 'Seksjon 3'])
    // Once is enough: its own scrolling ending asks for nothing more.
    fireEvent(document, new Event('scrollend'))
    expect(scrolled()).toHaveLength(2)
  })

  it('scrolls on after a second in a browser that does not say when the scrolling ended', () => {
    jest.useFakeTimers()
    renderReport(1, 2, 3)
    fireEvent.click(screen.getByRole('tab', { name: 'Leveranser' }))
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(scrolled()).toEqual(['Seksjon 2', 'Seksjon 2'])
  })

  it('does not take the page back to a section when another one is chosen', () => {
    jest.useFakeTimers()
    renderReport(1, 2, 3)
    fireEvent.click(screen.getByRole('tab', { name: 'Leveranser' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Usikkerhet' }))
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(scrolled()).toEqual(['Seksjon 2', 'Seksjon 3', 'Seksjon 3'])
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
