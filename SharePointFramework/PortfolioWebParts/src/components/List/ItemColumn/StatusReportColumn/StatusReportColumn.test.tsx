// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. Fluent positions an open popover against its trigger, which
// under jsdom took seconds a test. The popover is stood in for by one that keeps the part of
// Fluent's contract the cell relies on. The trigger gets `aria-expanded` unless its child sets its
// own (Fluent spreads the child's props after its own), toggles through `onOpenChange` on a click
// (a `click` with its target, as Fluent's trigger toggles), and reports the pointer coming and
// going where `openOnHover` is set, after the trigger's own handlers. The surface shows while
// open, a dialog with `aria-modal` when it traps the focus and a group when not, with the props
// it is given and a mark where it closes on scroll. As it opens it takes the focus as Fluent's
// does, unless `unstable_disableAutoFocus` is set: itself where it has a tab index, else its first
// link or button. The browser suite presses the keys in Fluent's own.
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const PopoverContext = React.createContext({})
  /** Shares the popover's props, its state, focus settings and `onOpenChange`, with its parts. */
  const Popover = ({ children, open, ...props }: any) => {
    const value = { ...props, open: !!open }
    return React.createElement(PopoverContext.Provider, { value }, children)
  }
  /**
   * Toggles on a click and reports the pointer, after the trigger's own handlers. The child's own
   * `aria-expanded` wins, as in Fluent's, which spreads the child's props after its own.
   */
  const PopoverTrigger = ({ children }: any) => {
    const { open, openOnHover, onOpenChange } = React.useContext(PopoverContext)
    const own = children.props
    return React.cloneElement(children, {
      'aria-expanded': own['aria-expanded'] ?? `${open}`,
      onClick: (event: any) => {
        own.onClick?.(event)
        onOpenChange({ type: 'click', target: event.target }, { open: !open })
      },
      onMouseEnter: (event: any) => {
        own.onMouseEnter?.(event)
        if (openOnHover) onOpenChange({ type: 'mouseenter' }, { open: true })
      },
      onMouseLeave: (event: any) => {
        own.onMouseLeave?.(event)
        if (openOnHover) onOpenChange({ type: 'mouseleave' }, { open: false })
      }
    })
  }
  /**
   * Shows the details while open: a dialog when it traps the focus, a group when not, marked when
   * it closes on scroll. As it opens it takes the focus as Fluent's does, unless told not to:
   * itself where it has a tab index, else its first link or button.
   */
  const PopoverSurface = ({ children, ...props }: any) => {
    const context = React.useContext(PopoverContext)
    const { open, trapFocus, closeOnScroll, unstable_disableAutoFocus: noAutoFocus } = context
    const ref = React.useRef(null)
    React.useEffect(() => {
      const surface = ref.current
      if (!open || noAutoFocus || !surface) return
      const first = surface.hasAttribute('tabindex')
        ? surface
        : surface.querySelector('a[href], button')
      first?.focus()
    }, [open, noAutoFocus])
    if (!open) return null
    const role = trapFocus ? 'dialog' : 'group'
    const modal = trapFocus ? true : undefined
    const scroll = closeOnScroll || undefined
    return React.createElement(
      'div',
      { ref, role, 'aria-modal': modal, 'data-close-on-scroll': scroll, ...props },
      children
    )
  }
  return { __esModule: true, ...actual, Popover, PopoverTrigger, PopoverSurface }
})

// A shielded project's report list is on its own site, which `fetchData` opens with
// `Web([hub, url])`: here the stand-in for that site's web, by address. Every other export stays
// the harness's stand-in for PnPjs.
const projectWebs: Record<string, any> = {}
/** Opens a shielded project's site as `Web([hub, url])` does: the stand-in for its web. */
function openProjectWeb([, url]: [unknown, string]) {
  return projectWebs[url]
}
jest.mock('@pnp/sp/webs', () => {
  const actual = jest.requireActual('@pnp/sp/webs')
  return new Proxy(actual, {
    get: (target, prop) => (prop === 'Web' ? openProjectWeb : target[prop])
  })
})

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'PortfolioWebPartsStrings'
import { format, formatDayMonth, IStatusShape, setPageContextInfo } from 'pp365-shared-library'
import { OSLO_TIME_ZONE } from 'pp365-shared-library/lib/util/testFixtures'
import * as React from 'react'
import resource from 'SharedResources'
import { fetchData } from './data'
import { getOpenSurface, resetOpenSurface } from './previewStore'
import { StatusReportColumn } from './StatusReportColumn'
import { IStatusReport, IStatusReportColumnData, IStatusSectionDefinition } from './types'

/** The template's status colours, and a blue and a grey a hub may add. */
const GREEN = '#2da748'
const YELLOW = '#e9b359'
const RED = '#ea5c73'
const BLUE = '#0078d4'
const GREY = '#8a8886'

/** The shape `getStatusShapes` gives each of these colours. */
const SHAPES: Record<string, IStatusShape> = {
  [GREEN]: { shape: 'check' },
  [YELLOW]: { shape: 'warning' },
  [RED]: { shape: 'cross' },
  [BLUE]: { shape: 'dot' },
  [GREY]: { shape: 'ring' }
}

/** A section's value, colour and comment; `[]` for a section without a value. */
type SectionValue = [string?, string?, string?]

/** A status section of the hub template, as `fetchData` gives it. */
function definition(fieldName: string, name: string, iconName: string): IStatusSectionDefinition {
  return { fieldName, name, iconName, colors: {}, shapes: {} }
}

/** The hub template's eight status sections, in their order. */
const SECTIONS = [
  definition('GtStatusTime', 'Fremdrift', 'CalendarClock'),
  definition('GtStatusBudget', 'Økonomi', 'Money'),
  definition('GtStatusQuality', 'Kvalitet', 'Box'),
  definition('GtStatusRisk', 'Risiko', 'Warning'),
  definition('GtStatusGainAchievement', 'Nytteoppnåelse', 'Trophy'),
  definition('GtStatusOpportunities', 'Muligheter', 'BranchFork'),
  definition('GtStatusScope', 'Omfang', 'TextBulletList'),
  definition('GtStatusSustainability', 'Bærekraft', 'Globe')
]

/** The shape of a value: `empty` without one, `unknown` for one the hub has no colour for. */
function shapeOf(value?: string, color?: string): IStatusShape {
  if (!value) return { shape: 'empty' }
  return SHAPES[color] ?? { shape: 'unknown' }
}

/** A published report on the template's sections: each section's value, in their order. */
function report(
  id: number,
  siteId: string,
  publishedDate: string,
  overallStatus: string | undefined,
  values: SectionValue[]
): IStatusReport {
  return {
    id,
    siteId,
    scopeKey: '',
    publishedDate,
    overallStatus,
    sections: SECTIONS.map(({ fieldName, name, iconName }, index) => {
      const [value, color, comment] = values[index]
      return { fieldName, name, iconName, value, color, comment, shape: shapeOf(value, color) }
    })
  }
}

const P1_SITE = 'c0a8f2d1-4b6e-4f3a-9d2c-1e5b7a9c3f01'
const P4_SITE = 'c0a8f2d1-4b6e-4f3a-9d2c-1e5b7a9c3f04'
const P5_SITE = 'c0a8f2d1-4b6e-4f3a-9d2c-1e5b7a9c3f05'
const P6_SITE = 'c0a8f2d1-4b6e-4f3a-9d2c-1e5b7a9c3f06'
const P7_SITE = 'c0a8f2d1-4b6e-4f3a-9d2c-1e5b7a9c3f07'
const P1_DATE = '2026-11-03T10:00:00Z'
const P5_DATE = '2026-10-28T10:00:00Z'
const P6_DATE = '2026-10-02T10:00:00Z'
const P7_DATE = '2026-09-15T10:00:00Z'
const P1_OVERALL = 'I rute, med unntak av grunnarbeidene.'
const P1_COUNTS = '1 rød, 4 gule, 3 grønne'
const P5_COUNTS = '1 gul, 2 i annen farge, 5 grønne'
const P6_COUNTS = '2 gule, 2 uten verdi, 4 grønne'
const P7_COUNTS = '1 i annen farge, 7 grønne'

/**
 * «Ny barneskole Østbyen»: one red, four yellow and three green, with comments and an overall
 * status. Its site id in upper case: the row's is compared in any case.
 */
const P1_REPORT = report(101, P1_SITE.toUpperCase(), P1_DATE, P1_OVERALL, [
  ['Mindre forsinkelser', YELLOW, 'Modulleveransen er tre uker forsinket.'],
  ['Over budsjett', RED, 'Merkostnad på grunnarbeider, 2,1 MNOK.'],
  ['Ihht. spesifikasjon', GREEN],
  ['Medium', YELLOW],
  ['Ikke påbegynt', YELLOW],
  ['Medium', YELLOW],
  ['Iht. planlagt omfang', GREEN],
  ['Iht. bærekraftskravene', GREEN]
])

/** «Grønn mobilitet 2030»: a blue and a grey value, which tell of neither good nor bad. */
const P5_REPORT = report(105, P5_SITE, P5_DATE, undefined, [
  ['På plan', GREEN],
  ['Vet ikke', YELLOW],
  ['Ihht. spesifikasjon', GREEN],
  ['Lav', GREEN],
  ['På plan', GREEN],
  ['Høy', GREEN],
  ['Under avklaring', BLUE],
  ['Ikke vurdert', GREY]
])

/** «Rehabilitering rådhus»: the last two sections without a value. */
const P6_REPORT = report(106, P6_SITE, P6_DATE, undefined, [
  ['På plan', GREEN],
  ['Mindre overskridelser', YELLOW],
  ['Ihht. spesifikasjon', GREEN],
  ['Lav', GREEN],
  ['På plan', GREEN],
  ['Medium', YELLOW],
  [],
  []
])

/** «Ny skolestruktur»: a value the hub's configuration has no colour for. */
const P7_REPORT = report(107, P7_SITE, P7_DATE, undefined, [
  ['Utsatt'],
  ['På budsjett', GREEN],
  ['Ihht. spesifikasjon', GREEN],
  ['Lav', GREEN],
  ['På plan', GREEN],
  ['Høy', GREEN],
  ['Iht. planlagt omfang', GREEN],
  ['Iht. bærekraftskravene', GREEN]
])

/** The column's data as `fetchData` gives it. */
const DATA: IStatusReportColumnData = {
  sections: SECTIONS,
  overallStatusName: 'Overordnet status',
  reports: [P1_REPORT, P5_REPORT, P6_REPORT, P7_REPORT]
}

/** The rows: each project with its site's address and the report search found for it. */
const P1 = {
  SiteId: P1_SITE,
  Title: 'Ny barneskole Østbyen',
  Path: 'https://contoso.sharepoint.com/sites/barneskole/',
  StatusReportId: 101
}
const P4 = { SiteId: P4_SITE, Title: 'Ny sak- og arkivløsning' }
const P5 = {
  SiteId: P5_SITE,
  Title: 'Grønn mobilitet 2030',
  SPWebUrl: 'https://contoso.sharepoint.com/sites/mobilitet',
  StatusReportId: 105
}
const P6 = { SiteId: P6_SITE, Title: 'Rehabilitering rådhus', StatusReportId: 106 }
const P7 = { SiteId: P7_SITE, Title: 'Ny skolestruktur', StatusReportId: 107 }

/** The status report column with the data `fetchData` gave it, or with none. */
function column(data?: IStatusReportColumnData): any {
  return { key: '-', fieldName: '-', name: 'Statusrapport', minWidth: 200, data: { $: data } }
}

/** Renders a row's status report cell, the column's data in. */
function renderCell(item: Record<string, any>, props: Record<string, any> = {}) {
  return render(<StatusReportColumn item={item} column={column(DATA)} {...props} />)
}

/** The strip's name for a report published on `date`, with its counts. */
function stripName(date: string, counts: string): string {
  return format(strings.StatusReportButtonLabel, formatDayMonth(date, true), counts)
}

/** The strip of a report published on `date`, found by its name. */
function getStrip(date: string, counts: string): HTMLElement {
  return screen.getByRole('button', { name: stripName(date, counts) })
}

/** The shapes the tiles in an element show, in their order. */
function glyphs(element: Element): string[] {
  const found = Array.from(element.querySelectorAll('[data-status-glyph]'))
  return found.map((glyph) => glyph.getAttribute('data-status-glyph'))
}

/** The fill and the ink the tile holding a shape is given, as its stylesheet reads them. */
function tones(glyph: Element): string[] {
  const { style } = glyph.parentElement
  return [style.getPropertyValue('--fill'), style.getPropertyValue('--ink')]
}

/** Rests the pointer on a strip for half a second, on fake timers. */
function hover(strip: HTMLElement): void {
  fireEvent.mouseEnter(strip)
  act(() => {
    jest.advanceTimersByTime(500)
  })
}

/**
 * The status report cell: a strip of tiles, one for each status section of the row's latest
 * published report, which is a button named by the report's date and a count of each colour and
 * described by every section's value; the report's details as a preview while the pointer rests
 * on it and as a dialog on a click; «Ingen publisert rapport» where the hub's own project has none.
 */
describe('StatusReportColumn', () => {
  beforeEach(() => {
    // The site's language and time zone, as the page gives them: the dates are Oslo's.
    setPageContextInfo({ currentUICultureName: 'nb-NO', webTimeZoneData: OSLO_TIME_ZONE })
  })

  afterEach(async () => {
    // Real timers first: on fake ones the wait below would never end.
    jest.useRealTimers()
    cleanup()
    // Each cell gives its surface up as it unmounts; the reset keeps a failure to its own test.
    const leftOpen = getOpenSurface()
    resetOpenSurface()
    setPageContextInfo(undefined)
    await act(() => new Promise<void>((resolve) => setTimeout(resolve, 50)))
    expect(leftOpen).toBeUndefined()
  })

  it("names the strip by the report's date and a count of each colour, and describes it by every section's value (WCAG 1.1.1, 4.1.2)", () => {
    renderCell(P1)
    const name = stripName(P1_DATE, P1_COUNTS)
    expect(name).toBe('Statusrapport 3. nov. 2026: 1 rød, 4 gule, 3 grønne')
    const strip = getStrip(P1_DATE, P1_COUNTS)
    const description = [
      'Fremdrift: Mindre forsinkelser.',
      'Økonomi: Over budsjett.',
      'Kvalitet: Ihht. spesifikasjon.',
      'Risiko: Medium.',
      'Nytteoppnåelse: Ikke påbegynt.',
      'Muligheter: Medium.',
      'Omfang: Iht. planlagt omfang.',
      'Bærekraft: Iht. bærekraftskravene.'
    ]
    expect(strip).toHaveAccessibleDescription(description.join(' '))
    expect(strip).toHaveAttribute('type', 'button')
    expect(strip).toHaveAttribute('aria-haspopup', 'dialog')
    expect(strip).toHaveAttribute('aria-expanded', 'false')
  })

  it("shows a tile for each section in the hub's order, with its value's shape, and none for the overall status (WCAG 1.4.1)", () => {
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    expect(glyphs(strip).join(' ')).toBe('warning cross check warning warning warning check check')
  })

  it('shows a section without a value as a dashed tile with a dash, and says it has none', () => {
    renderCell(P6)
    const strip = getStrip(P6_DATE, P6_COUNTS)
    expect(glyphs(strip).slice(6)).toEqual(['empty', 'empty'])
    expect(strip.querySelector('[data-status-glyph="empty"]').parentElement).toHaveClass('empty')
    const description = [
      'Fremdrift: På plan.',
      'Økonomi: Mindre overskridelser.',
      'Kvalitet: Ihht. spesifikasjon.',
      'Risiko: Lav.',
      'Nytteoppnåelse: På plan.',
      'Muligheter: Medium.',
      'Omfang: ingen verdi.',
      'Bærekraft: ingen verdi.'
    ]
    expect(strip).toHaveAccessibleDescription(description.join(' '))
  })

  it('draws blue and grey with neutral shapes of their own, and «?» for a value the hub has no colour for', () => {
    renderCell(P5)
    const strip = getStrip(P5_DATE, P5_COUNTS)
    expect(glyphs(strip).slice(6)).toEqual(['dot', 'ring'])
    cleanup()
    renderCell(P7)
    const other = getStrip(P7_DATE, P7_COUNTS)
    const unknown = other.querySelector('[data-status-glyph="unknown"]')
    expect(unknown).toHaveTextContent('?')
    expect(unknown.parentElement).toHaveClass('neutral')
  })

  it("gives a tile a light and a dark tone of its value's colour, and a neutral or an empty tile neither (WCAG 1.4.11)", () => {
    renderCell(P1)
    const cross = getStrip(P1_DATE, P1_COUNTS).querySelector('[data-status-glyph="cross"]')
    // The red's tones as `getStatusTile` gives them: the fill behind the shape, and its ink.
    expect(tones(cross)).toEqual(['#fad6dc', '#a54151'])
    cleanup()
    renderCell(P7)
    const unknown = getStrip(P7_DATE, P7_COUNTS).querySelector('[data-status-glyph="unknown"]')
    expect(tones(unknown)).toEqual(['', ''])
    cleanup()
    renderCell(P6)
    const empty = getStrip(P6_DATE, P6_COUNTS).querySelector('[data-status-glyph="empty"]')
    expect(tones(empty)).toEqual(['', ''])
  })

  it('shows nothing for a report where the hub shows no status section, rather than an empty button (WCAG 2.5.8)', () => {
    const data: IStatusReportColumnData = {
      ...DATA,
      sections: [],
      reports: DATA.reports.map((published) => ({ ...published, sections: [] }))
    }
    const { container } = render(<StatusReportColumn item={P1} column={column(data)} />)
    expect(container).toBeEmptyDOMElement()
    expect(StatusReportColumn.getMinWidth(column(data))).toBeUndefined()
    expect(StatusReportColumn.renderHeaderAddon(column(data))).toBeNull()
  })

  it("says «Ingen publisert rapport» where the hub has its data and its own row no report, in a merged view too, and nothing where it has not, the row is another hub's or the report not the row's", () => {
    renderCell(P4)
    expect(screen.getByText(strings.StatusReportNone)).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    cleanup()
    // A merged view's row of the configured hub, the primary one.
    renderCell({ ...P4, _hubId: 'hub-1', _isPrimaryHub: true })
    expect(screen.getByText(strings.StatusReportNone)).toBeInTheDocument()
    cleanup()
    // A merged view's row of another hub, whose reports are not read here, and a report the hub
    // did not return.
    expect(renderCell({ ...P4, _hubId: 'hub-2' }).container).toBeEmptyDOMElement()
    cleanup()
    expect(renderCell({ ...P1, StatusReportId: 999 }).container).toBeEmptyDOMElement()
    cleanup()
    // A report of another project, and of another report series of the row's project.
    expect(renderCell({ ...P4, StatusReportId: 101 }).container).toBeEmptyDOMElement()
    cleanup()
    expect(renderCell({ ...P1, ScopeKey: 'DP1' }).container).toBeEmptyDOMElement()
    cleanup()
    // The program's views and the aggregations, where the column has no data.
    const { container } = render(<StatusReportColumn item={P4} column={column()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("finds a shielded project's report by its id in the list on the project's site, though the hub's list has a report with that id", () => {
    const siteUrl = 'https://contoso.sharepoint.com/sites/skjermet'
    const green = SECTIONS.map((): SectionValue => ['På plan', GREEN])
    // Report 101 of the shielded project's own list, beside the hub's report 101 (P1's).
    const shielded = { ...report(101, P4_SITE, P5_DATE, undefined, green), webUrl: siteUrl }
    const data = { ...DATA, reports: [...DATA.reports, shielded] }
    const shieldedRow = { ...P4, StatusReportId: 101, StatusReportWebUrl: siteUrl }
    render(<StatusReportColumn item={shieldedRow} column={column(data)} />)
    expect(getStrip(P5_DATE, '8 grønne')).toBeInTheDocument()
    cleanup()
    // The hub's row keeps the hub's report 101.
    render(<StatusReportColumn item={P1} column={column(data)} />)
    expect(getStrip(P1_DATE, P1_COUNTS)).toBeInTheDocument()
    cleanup()
    // A report another site holds is not the hub's report with that id.
    const elsewhere = { ...P1, StatusReportWebUrl: 'https://contoso.sharepoint.com/sites/annet' }
    const { container } = render(<StatusReportColumn item={elsewhere} column={column(data)} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a preview, which leaves the focus where it is and closes on scroll, once the pointer has rested on the strip for half a second (WCAG 1.4.13)', () => {
    jest.useFakeTimers()
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    strip.focus()
    fireEvent.mouseEnter(strip)
    act(() => {
      jest.advanceTimersByTime(499)
    })
    expect(screen.queryByRole('group')).toBeNull()
    act(() => {
      jest.advanceTimersByTime(1)
    })
    const preview = screen.getByRole('group', { name: P1.Title })
    // Told nothing, Fluent would give the focus to the link in it, its first control.
    expect(within(preview).getByRole('link', { name: strings.StatusReportOpenLink })).toBeTruthy()
    expect(strip).toHaveFocus()
    expect(preview).toHaveAttribute('data-close-on-scroll', 'true')
    expect(preview).not.toHaveAttribute('tabindex')
    expect(preview).not.toHaveAttribute('aria-modal')
    expect(within(preview).queryByRole('button', { name: strings.CloseText })).toBeNull()
    // The strip announces a dialog, which the preview is not.
    expect(strip).toHaveAttribute('aria-expanded', 'false')
    expect(strip).not.toHaveAttribute('data-pinned')
  })

  it('closes the preview on Escape wherever the focus is, unless something else has taken the key', () => {
    jest.useFakeTimers()
    renderCell(P1)
    hover(getStrip(P1_DATE, P1_COUNTS))
    const takeKey = (event: KeyboardEvent) => event.preventDefault()
    document.addEventListener('keydown', takeKey, true)
    fireEvent.keyDown(document.body, { key: 'Escape' })
    document.removeEventListener('keydown', takeKey, true)
    expect(screen.getByRole('group')).toBeInTheDocument()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(screen.queryByRole('group')).toBeNull()
  })

  it('pins the details on a click as a dialog that takes the focus, named by the project and the date, until «Lukk» closes it (WCAG 2.4.3, 4.1.2)', () => {
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    fireEvent.click(strip)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    // With a tab index Fluent focuses the surface itself as it opens.
    expect(dialog).toHaveAttribute('tabindex', '-1')
    expect(dialog).toHaveFocus()
    expect(dialog).not.toHaveAttribute('data-close-on-scroll')
    const reported = format(strings.StatusReportedText, formatDayMonth(P1_DATE, true))
    expect(reported).toBe('Status rapportert 3. nov. 2026')
    expect(dialog).toHaveAccessibleName(`${P1.Title} ${reported}`)
    expect(dialog).toHaveAccessibleDescription(P1_OVERALL)
    expect(strip).toHaveAttribute('aria-expanded', 'true')
    expect(strip).toHaveAttribute('data-pinned', 'true')
    expect(within(dialog).getByRole('heading', { level: 2, name: P1.Title })).toBeInTheDocument()
    expect(within(dialog).getByText('Modulleveransen er tre uker forsinket.')).toBeInTheDocument()
    const link = within(dialog).getByRole('link', { name: strings.StatusReportOpenLink })
    const href = `${P1.Path}${resource.Navigation_ProjectStatus_Url}?selectedReport=101`
    expect(link).toHaveAttribute('href', href)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent.click(within(dialog).getByRole('button', { name: strings.CloseText }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(strip).toHaveAttribute('aria-expanded', 'false')
  })

  it("pins a preview on a click, which Fluent's trigger sends as a close, as a dialog that takes the focus", () => {
    jest.useFakeTimers()
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    hover(strip)
    expect(screen.getByRole('group')).toBeInTheDocument()
    fireEvent.click(strip)
    expect(screen.queryByRole('group')).toBeNull()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('tabindex', '-1')
    expect(dialog).toHaveFocus()
    expect(strip).toHaveAttribute('data-pinned', 'true')
  })

  it('closes the preview once the pointer has left the strip (WCAG 1.4.13)', () => {
    jest.useFakeTimers()
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    hover(strip)
    expect(screen.getByRole('group')).toBeInTheDocument()
    fireEvent.mouseLeave(strip)
    expect(screen.queryByRole('group')).toBeNull()
  })

  it('keeps the pinned details open when the pointer leaves the strip', () => {
    jest.useFakeTimers()
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    fireEvent.click(strip)
    fireEvent.mouseLeave(strip)
    act(() => {
      jest.advanceTimersByTime(500)
    })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(strip).toHaveAttribute('data-pinned', 'true')
  })

  it('opens no preview when the pointer leaves the strip before half a second has passed', () => {
    jest.useFakeTimers()
    renderCell(P1)
    const strip = getStrip(P1_DATE, P1_COUNTS)
    fireEvent.mouseEnter(strip)
    act(() => {
      jest.advanceTimersByTime(300)
    })
    // The strip's own handler: Fluent reports the pointer leaving only after its delay.
    fireEvent.pointerLeave(strip)
    act(() => {
      jest.advanceTimersByTime(300)
    })
    expect(screen.queryByRole('group')).toBeNull()
  })

  it("opens no preview where the column's setting turns it off, and still pins on a click", () => {
    jest.useFakeTimers()
    renderCell(P1, { openOnHover: false })
    const strip = getStrip(P1_DATE, P1_COUNTS)
    hover(strip)
    expect(screen.queryByRole('group')).toBeNull()
    fireEvent.click(strip)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps one surface open across the cells, and opens no preview while one is pinned', () => {
    jest.useFakeTimers()
    render(
      <>
        <StatusReportColumn item={P1} column={column(DATA)} />
        <StatusReportColumn item={P5} column={column(DATA)} />
      </>
    )
    const second = getStrip(P5_DATE, P5_COUNTS)
    fireEvent.click(getStrip(P1_DATE, P1_COUNTS))
    hover(second)
    expect(screen.queryByRole('group')).toBeNull()
    fireEvent.click(second)
    const dialogs = screen.getAllByRole('dialog')
    expect(dialogs).toHaveLength(1)
    expect(within(dialogs[0]).getByRole('heading', { level: 2, name: P5.Title })).toBeTruthy()
    const link = within(dialogs[0]).getByRole('link', { name: strings.StatusReportOpenLink })
    const href = `${P5.SPWebUrl}/${resource.Navigation_ProjectStatus_Url}?selectedReport=105`
    expect(link).toHaveAttribute('href', href)
  })

  it("renders no closed cell again when another cell's details open, are pinned or close", () => {
    jest.useFakeTimers()
    const onRender = jest.fn()
    render(
      <>
        <StatusReportColumn item={P1} column={column(DATA)} />
        <React.Profiler id='closed' onRender={onRender}>
          <StatusReportColumn item={P5} column={column(DATA)} />
        </React.Profiler>
      </>
    )
    onRender.mockClear()
    const strip = getStrip(P1_DATE, P1_COUNTS)
    hover(strip)
    expect(screen.getByRole('group')).toBeInTheDocument()
    fireEvent.click(strip)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: strings.CloseText }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onRender).not.toHaveBeenCalled()
  })

  it("gives the surface up as a pinned cell goes, so another cell's preview opens", () => {
    jest.useFakeTimers()
    const { unmount } = renderCell(P1)
    fireEvent.click(getStrip(P1_DATE, P1_COUNTS))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    unmount()
    expect(getOpenSurface()).toBeUndefined()
    renderCell(P5)
    hover(getStrip(P5_DATE, P5_COUNTS))
    expect(screen.getByRole('group', { name: P5.Title })).toBeInTheDocument()
  })

  it('offers a setting that turns the preview off, on by default', () => {
    const onChange = jest.fn()
    const [field]: any[] = StatusReportColumn.getDataTypeProperties(onChange, {})
    expect(field).toMatchObject({
      kind: 'switch',
      label: strings.StatusReportOpenOnHoverLabel,
      checked: true
    })
    field.onChange(false)
    expect(onChange).toHaveBeenCalledWith('openOnHover', false)
    const [off]: any[] = StatusReportColumn.getDataTypeProperties(onChange, { openOnHover: false })
    expect(off.checked).toBe(false)
  })

  it("widens the column to fit every tile, and puts the sections' letters in its header", () => {
    expect(StatusReportColumn.getMinWidth(column(DATA))).toBe(182)
    expect(StatusReportColumn.getMinWidth(column())).toBeUndefined()
    expect(StatusReportColumn.renderHeaderAddon(column())).toBeNull()
    const { container } = render(<>{StatusReportColumn.renderHeaderAddon(column(DATA))}</>)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(container).toHaveTextContent('FrØkKvRiNyMuOmBæ')
    expect(screen.getByTitle('Nytteoppnåelse')).toHaveTextContent('Ny')
  })

  it('passes axe, closed and pinned', async () => {
    const { container } = renderCell(P1)
    expect(await axeComponent(container)).toHaveNoViolations()
    fireEvent.click(getStrip(P1_DATE, P1_COUNTS))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(await axeComponent(container)).toHaveNoViolations()
  })
})

/** Each query made on the stand-in for PnPjs, by list title: its methods and their arguments. */
type Queries = Record<string, Array<Record<string, any[]>>>

/** The fields of a status section `fetchData` reads. */
const SECTION_FIELDS = [
  'Title',
  'GtSecFieldName',
  'GtSecIcon',
  'GtSortOrder',
  'GtSecShowInStatusSection'
]

/** A row of `Statusseksjoner`. */
function sectionItem(order: number, fieldName: string, title: string, shown = true) {
  return {
    Title: title,
    GtSecFieldName: fieldName,
    GtSecIcon: 'Money',
    GtSortOrder: order,
    GtSecShowInStatusSection: shown
  }
}

/**
 * A row of `Prosjektkolonnekonfigurasjon`: a status field's value, its colour, and its icon, the
 * template's circle (no icon of its own) unless another is given.
 */
function configItem(fieldName: string, value: string, color: string, iconName = 'CircleFill') {
  return {
    GtPortfolioColumn: { Title: fieldName, GtInternalName: fieldName },
    GtPortfolioColumnValue: value,
    GtPortfolioColumnColor: color,
    GtPortfolioColumnIconName: iconName
  }
}

/** The hub's lists, by title, as the stand-in for PnPjs reads them. */
const LISTS: Record<string, Array<Record<string, any>>> = {
  [resource.Lists_StatusSections_Title]: [
    sectionItem(30, 'GtStatusBudget', 'Økonomi'),
    sectionItem(10, 'GtOverallStatus', 'Overordnet status'),
    sectionItem(20, 'GtStatusTime', 'Fremdrift'),
    sectionItem(40, 'GtStatusQuality', 'Kvalitet', false),
    sectionItem(5, 'GtSectionProjectProperties', 'Prosjektegenskaper')
  ],
  [resource.Lists_ProjectColumnConfiguration_Title]: [
    configItem('GtStatusTime', 'På plan', GREEN),
    configItem('GtStatusTime', 'Mindre forsinkelser', YELLOW),
    configItem('GtStatusTime', 'Store forsinkelser', RED),
    configItem('GtStatusBudget', 'På budsjett', GREEN),
    configItem('GtStatusBudget', 'Over budsjett', RED, 'Flag')
  ],
  [resource.Lists_ProjectStatus_Title]: [
    {
      Id: 7,
      GtSiteId: P1_SITE,
      GtLastReportDate: P1_DATE,
      Created: '2026-11-01T09:00:00Z',
      GtOverallStatus: P1_OVERALL,
      GtStatusTime: 'Mindre forsinkelser',
      GtStatusTimeComment: 'Modulleveransen er tre uker forsinket.',
      GtStatusBudget: 'Ukjent verdi'
    },
    {
      Id: 52,
      GtSiteId: `${P5_SITE}-DP1`,
      GtLastReportDate: null,
      Created: P5_DATE,
      GtStatusTime: 'På plan',
      GtStatusBudget: ''
    }
  ]
}

/** The id an `Id eq 7` clause names. */
function idOf(clause: string): number {
  return Number(clause.replace('Id eq ', ''))
}

/** The filter of a request for the reports `first` to `last`. */
function idFilter(first: number, last: number): string {
  const ids = Array.from({ length: last - first + 1 }, (_id, index) => first + index)
  return ids.map((id) => `Id eq ${id}`).join(' or ')
}

/**
 * A stand-in for the hub's web in PnPjs: each access to a list's `items` starts a query, which
 * records its methods and their arguments and, called, returns the list's rows, those its
 * `Id eq` filter names where it has one.
 */
function standInWeb(lists: Record<string, Array<Record<string, any>>>, queries: Queries) {
  const startQuery = (title: string) => {
    const query: Record<string, any[]> = {}
    queries[title] = [...(queries[title] ?? []), query]
    const rows = () => {
      const filter: string = query.filter?.[0] ?? ''
      const ids = filter.startsWith('Id eq') ? filter.split(' or ').map(idOf) : undefined
      return lists[title].filter((row) => !ids || ids.includes(row.Id))
    }
    const chain: any = new Proxy(() => Promise.resolve(rows()), {
      get(_target, method: string) {
        return (...args: any[]) => {
          query[method] = args
          return chain
        }
      }
    })
    return chain
  }
  return {
    lists: {
      getByTitle: (title: string) => ({
        get items() {
          return startQuery(title)
        }
      })
    }
  }
}

/**
 * What the status report cells show, read from the hub: the sections in the hub's order, each
 * value's colour and shape, and the reports the configured hub's rows point to, by id.
 */
describe('fetchData', () => {
  it('reads the reports the rows point to by id, 50 to a request, and no report where no row has one', async () => {
    const queries: Queries = {}
    const ids = Array.from({ length: 55 }, (_id, index) => index + 1)
    const rows: Record<string, any>[] = ids.map((id) => ({ StatusReportId: id }))
    // Each report once, and only ids that can be a list item's.
    rows.push({ StatusReportId: 3 }, { StatusReportId: 0 }, { StatusReportId: 2.5 }, {})
    const data = await fetchData(standInWeb(LISTS, queries) as any, undefined, rows)
    const reportQueries = queries[resource.Lists_ProjectStatus_Title]
    const filters = reportQueries.map(({ filter }) => filter[0])
    expect(filters).toEqual([idFilter(1, 50), idFilter(51, 55)])
    expect(reportQueries.map(({ top }) => top[0])).toEqual([50, 5])
    // Every field, so a hub's own section fields come too.
    expect(reportQueries.every(({ select }) => !select)).toBe(true)
    expect(data.reports.map(({ id }) => id)).toEqual([7, 52])
    const noIds: Queries = {}
    await fetchData(standInWeb(LISTS, noIds) as any, undefined, [{ Title: 'Uten rapport' }])
    expect(noIds[resource.Lists_ProjectStatus_Title]).toBeUndefined()
  })

  it("reads only the reports of the configured hub's rows, in a merged view the primary hub's", async () => {
    const queries: Queries = {}
    const rows = [
      { _hubId: 'hub-1', _isPrimaryHub: true, StatusReportId: 7 },
      { _hubId: 'hub-1', _isPrimaryHub: true, StatusReportId: 52 },
      // Another hub's row names an item of that hub's report list.
      { _hubId: 'hub-2', StatusReportId: 60 }
    ]
    const data = await fetchData(standInWeb(LISTS, queries) as any, undefined, rows)
    const [reportQuery] = queries[resource.Lists_ProjectStatus_Title]
    expect(reportQuery.filter).toEqual(['Id eq 7 or Id eq 52'])
    expect(data.reports.map(({ id }) => id)).toEqual([7, 52])
    const otherHub: Queries = {}
    await fetchData(standInWeb(LISTS, otherHub) as any, undefined, [rows[2]])
    expect(otherHub[resource.Lists_ProjectStatus_Title]).toBeUndefined()
  })

  it("reads the sections in the hub's order, only the status fields its status section shows, the overall status section's title, and each value's colour and icon", async () => {
    const queries: Queries = {}
    const data = await fetchData(standInWeb(LISTS, queries) as any, undefined, [])
    expect(data.sections.map(({ name }) => name)).toEqual(['Fremdrift', 'Økonomi'])
    expect(data.overallStatusName).toBe('Overordnet status')
    const [sectionQuery] = queries[resource.Lists_StatusSections_Title]
    expect(sectionQuery.select).toEqual(SECTION_FIELDS)
    // The configuration in the order it was made in, which the shapes are given out in.
    const [configQuery] = queries[resource.Lists_ProjectColumnConfiguration_Title]
    expect(configQuery.filter).toEqual(["startswith(GtPortfolioColumn/GtInternalName,'GtStatus')"])
    expect(configQuery.orderBy).toEqual(['ID', true])
    expect(configQuery.select).toContain('GtPortfolioColumnColor')
    expect(configQuery.select).toContain('GtPortfolioColumnIconName')
  })

  it('gives each value its colour and shape, its own icon where it has one, and dates a report by when it was published, else made', async () => {
    const rows = [{ StatusReportId: 7 }, { StatusReportId: 52 }]
    const data = await fetchData(standInWeb(LISTS, {}) as any, undefined, rows)
    const [time, budget] = data.sections
    expect(time.colors).toEqual({
      'På plan': GREEN,
      'Mindre forsinkelser': YELLOW,
      'Store forsinkelser': RED
    })
    expect(time.shapes).toEqual({
      'På plan': { shape: 'check' },
      'Mindre forsinkelser': { shape: 'warning' },
      'Store forsinkelser': { shape: 'cross' }
    })
    expect(budget.shapes['Over budsjett']).toEqual({ shape: 'icon', iconName: 'Flag' })
    const [published, older] = data.reports
    expect(published).toMatchObject({
      id: 7,
      siteId: P1_SITE,
      scopeKey: '',
      publishedDate: P1_DATE,
      overallStatus: P1_OVERALL
    })
    expect(published.sections).toEqual([
      {
        fieldName: 'GtStatusTime',
        name: 'Fremdrift',
        iconName: 'Money',
        value: 'Mindre forsinkelser',
        comment: 'Modulleveransen er tre uker forsinket.',
        color: YELLOW,
        shape: { shape: 'warning' }
      },
      {
        fieldName: 'GtStatusBudget',
        name: 'Økonomi',
        iconName: 'Money',
        value: 'Ukjent verdi',
        comment: undefined,
        color: undefined,
        shape: { shape: 'unknown' }
      }
    ])
    expect(older).toMatchObject({ siteId: P5_SITE, scopeKey: 'DP1', publishedDate: P5_DATE })
    expect(older.overallStatus).toBeUndefined()
    expect(older.sections[1]).toMatchObject({ value: undefined, shape: { shape: 'empty' } })
  })

  it("reads a shielded project's report by id from the list on its own site, each site once and on its own, so one that fails leaves the others' reports in", async () => {
    const siteA = 'https://contoso.sharepoint.com/sites/skjermet-a'
    const siteB = 'https://contoso.sharepoint.com/sites/skjermet-b'
    const hubQueries: Queries = {}
    const siteQueries: Queries = {}
    projectWebs[siteA] = standInWeb(
      {
        [resource.Lists_ProjectStatus_Title]: [
          { Id: 7, GtSiteId: P4_SITE, Created: P5_DATE, GtStatusTime: 'På plan' }
        ]
      },
      siteQueries
    )
    // A site whose list cannot be read.
    projectWebs[siteB] = standInWeb({}, {})
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const rows = [
      { StatusReportId: 7 },
      { StatusReportId: 7, StatusReportWebUrl: siteA },
      { StatusReportId: 7, StatusReportWebUrl: siteA },
      { StatusReportId: 3, StatusReportWebUrl: siteB }
    ]
    const data = await fetchData(standInWeb(LISTS, hubQueries) as any, undefined, rows)
    warn.mockRestore()
    const filters = (queries: Queries) =>
      queries[resource.Lists_ProjectStatus_Title].map(({ filter }) => filter[0])
    expect(filters(hubQueries)).toEqual(['Id eq 7'])
    expect(filters(siteQueries)).toEqual(['Id eq 7'])
    expect(data.reports.map(({ id, webUrl, siteId }) => [id, webUrl, siteId])).toEqual([
      [7, undefined, P1_SITE],
      [7, siteA, P4_SITE]
    ])
    // The hub's report carries no site of its own.
    expect('webUrl' in data.reports[0]).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][1]).toMatchObject({ webUrl: siteB })
  })
})
