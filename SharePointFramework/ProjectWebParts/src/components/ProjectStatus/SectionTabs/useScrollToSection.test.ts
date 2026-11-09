import { act, renderHook } from '@testing-library/react'
import strings from 'ProjectWebPartsStrings'
import { hasArrived, useScrollToSection } from './useScrollToSection'

// jsdom has no layout and no `scrollIntoView`; the tests only need to see what it is asked for.
Element.prototype.scrollIntoView = jest.fn()
const scrollIntoView = Element.prototype.scrollIntoView as jest.Mock

/** The scroll requests so far: the section's text and how it was to be scrolled. */
const scrolled = () =>
  scrollIntoView.mock.calls.map(
    (args, i) => `${scrollIntoView.mock.contexts[i].textContent} ${args[0].behavior}`
  )

/** The report's sections below the tabs, by id. */
function renderSections(...ids: number[]): HTMLElement[] {
  return ids.map((id) => {
    const section = document.createElement('div')
    section.id = `${strings.ListSectionElementIdPrefix}${id}`
    section.textContent = `Seksjon ${id}`
    document.body.appendChild(section)
    return section
  })
}

/**
 * Where the page is: the section's top edge against the viewport, and the document's own scroll
 * position and size, as the layout jsdom lacks would give them.
 */
function layout(
  section: Element,
  top: number,
  page: { scrollTop: number; clientHeight: number; scrollHeight: number } = {
    scrollTop: 400,
    clientHeight: 800,
    scrollHeight: 3000
  }
): void {
  section.getBoundingClientRect = () => ({ top }) as DOMRect
  for (const [name, value] of Object.entries(page))
    Object.defineProperty(document.documentElement, name, { value, configurable: true })
}

const scrollEnd = (target: EventTarget = document) =>
  act(() => {
    target.dispatchEvent(new Event('scrollend', { bubbles: false }))
  })

describe('useScrollToSection', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    scrollIntoView.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
    document.body.innerHTML = ''
    for (const name of ['scrollTop', 'clientHeight', 'scrollHeight'])
      delete (document.documentElement as any)[name]
  })

  it('scrolls the section into view smoothly', () => {
    renderSections(1, 2)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    expect(scrolled()).toEqual(['Seksjon 2 smooth'])
  })

  it('leaves a section that arrived where it is once the scrolling has ended', () => {
    const [section] = renderSections(1)
    layout(section, 0)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(1))
    scrollEnd()
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(scrolled()).toEqual(['Seksjon 1 smooth'])
  })

  it('scrolls on to a section the scrolling stopped short of, wherever it ended', () => {
    // SharePoint's header collapsing mid-scroll, or a list fitting its columns, stops a smooth
    // scroll short of the section (CI runs 37111173832 and 39743189195).
    const [, section] = renderSections(1, 2)
    layout(section, 300)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    scrollEnd()
    expect(scrolled()).toEqual(['Seksjon 2 smooth', 'Seksjon 2 smooth'])
    layout(section, 0)
    scrollEnd()
    expect(scrolled()).toHaveLength(2)
  })

  it('scrolls on after a second in a browser that does not say when the scrolling ended', () => {
    const [, section] = renderSections(1, 2)
    layout(section, 300)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    act(() => {
      jest.advanceTimersByTime(999)
    })
    expect(scrolled()).toHaveLength(1)
    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(scrolled()).toEqual(['Seksjon 2 smooth', 'Seksjon 2 smooth'])
  })

  it('scrolls at once, which nothing interrupts, when two smooth scrolls did not get there', () => {
    const [, section] = renderSections(1, 2)
    layout(section, 300)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    scrollEnd()
    scrollEnd()
    expect(scrolled()).toEqual(['Seksjon 2 smooth', 'Seksjon 2 smooth', 'Seksjon 2 auto'])
    // The last word: no check follows it.
    scrollEnd()
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(scrolled()).toHaveLength(3)
  })

  it('does not take the page back to a section when another one is chosen', () => {
    const [, second, third] = renderSections(1, 2, 3)
    layout(second, 300)
    layout(third, 300)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    act(() => result.current(3))
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(scrolled()).toEqual(['Seksjon 2 smooth', 'Seksjon 3 smooth', 'Seksjon 3 smooth'])
  })

  it('scrolls the section as it is mounted now, not as it was when chosen', () => {
    // A report that reloads while the page scrolls mounts its sections anew; a detached element
    // scrolls nothing.
    const [stale] = renderSections(1)
    layout(stale, 300)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(1))
    stale.remove()
    const [fresh] = renderSections(1)
    fresh.textContent = 'Seksjon 1 (ny)'
    layout(fresh, 300)
    scrollEnd()
    expect(scrolled()).toEqual(['Seksjon 1 smooth', 'Seksjon 1 (ny) smooth'])
  })

  it('ignores the end of a scroll inside the report, such as a list scrolling itself', () => {
    const [, section] = renderSections(1, 2)
    layout(section, 300)
    const list = document.createElement('div')
    section.appendChild(list)
    const { result } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    scrollEnd(list)
    expect(scrolled()).toHaveLength(1)
  })

  it('asks for nothing after the tabs are gone', () => {
    const [, section] = renderSections(1, 2)
    layout(section, 300)
    const { result, unmount } = renderHook(() => useScrollToSection())
    act(() => result.current(2))
    unmount()
    scrollEnd()
    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(scrolled()).toHaveLength(1)
  })

  describe('hasArrived', () => {
    it('is there within a pixel of the top, clear of the tabs by its scroll margin', () => {
      const [section] = renderSections(1)
      section.style.scrollMarginTop = '80px'
      layout(section, 80)
      expect(hasArrived(section)).toBe(true)
      layout(section, 81)
      expect(hasArrived(section)).toBe(true)
      layout(section, 82)
      expect(hasArrived(section)).toBe(false)
      layout(section, 0)
      expect(hasArrived(section)).toBe(false)
    })

    it('is there when the page has scrolled as far as it goes and the section is below the top', () => {
      // The last sections cannot reach the top: the page ends first.
      const [section] = renderSections(1)
      layout(section, 300, { scrollTop: 2200, clientHeight: 800, scrollHeight: 3000 })
      expect(hasArrived(section)).toBe(true)
      layout(section, -300, { scrollTop: 2200, clientHeight: 800, scrollHeight: 3000 })
      expect(hasArrived(section)).toBe(false)
    })

    it('measures against the element that scrolls the report, not the viewport', () => {
      const region = document.createElement('div')
      region.style.overflowY = 'auto'
      Object.defineProperty(region, 'scrollHeight', { value: 3000, configurable: true })
      Object.defineProperty(region, 'clientHeight', { value: 800, configurable: true })
      region.getBoundingClientRect = () => ({ top: 200 }) as DOMRect
      document.body.appendChild(region)
      const section = document.createElement('div')
      region.appendChild(section)
      section.getBoundingClientRect = () => ({ top: 200 }) as DOMRect
      expect(hasArrived(section)).toBe(true)
      section.getBoundingClientRect = () => ({ top: 0 }) as DOMRect
      expect(hasArrived(section)).toBe(false)
    })
  })
})
