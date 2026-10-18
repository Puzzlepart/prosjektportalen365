// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The calendar (`react-calendar-timeline`) needs a real layout,
// so it is a stand-in that draws each group and item through the timeline's own renderers, the
// items inside its scroll element (`.rct-scroll`, handed to `scrollRef` as the calendar does), and
// shows the time frame and sidebar it was given. Fluent's popover and menu are stand-ins that keep
// their contract (see the testing guide): the details popover shows while open, with the props its
// surface is given, and reports Escape through `onOpenChange`, and the menu trigger toggles through
// `onOpenChange`.
jest.mock('react-calendar-timeline', () => {
  const React = jest.requireActual('react')
  const Calendar = (props: any) =>
    React.createElement(
      'div',
      {
        'data-testid': 'calendar',
        'data-sidebar': props.sidebarWidth,
        'data-start': props.defaultTimeStart.format('YYYY-MM-DD'),
        'data-end': props.defaultTimeEnd.format('YYYY-MM-DD')
      },
      props.groups.map((group: any) =>
        React.createElement('div', { key: `group-${group.id}` }, props.groupRenderer({ group }))
      ),
      React.createElement(
        'div',
        { className: 'rct-scroll', ref: props.scrollRef },
        props.items.map((item: any) =>
          React.createElement(
            'div',
            { key: `item-${item.id}` },
            props.itemRenderer({
              item,
              itemContext: { dimensions: { height: 20 } },
              getItemProps: (itemProps: any) => itemProps
            })
          )
        )
      )
    )
  const Empty = () => null
  return {
    __esModule: true,
    default: Calendar,
    TimelineMarkers: Empty,
    CustomMarker: Empty,
    TodayMarker: Empty
  }
})
jest.mock('@fluentui/react-components', () => {
  const actual = jest.requireActual('@fluentui/react-components')
  const React = jest.requireActual('react')
  const Popover = ({ open, onOpenChange, children }: any) =>
    open
      ? React.createElement(
          'div',
          {
            onKeyDown: (event: any) =>
              event.key === 'Escape' && onOpenChange?.(event, { open: false })
          },
          children
        )
      : null
  const PopoverSurface = ({ children, ...props }: any) =>
    React.createElement('div', { role: 'dialog', ...props }, children)
  const MenuContext = React.createContext({ open: false, toggle: (_event: any) => undefined })
  const Menu = ({ open, onOpenChange, children }: any) =>
    React.createElement(
      MenuContext.Provider,
      { value: { open, toggle: (event: any) => onOpenChange?.(event, { open: !open }) } },
      children
    )
  const MenuTrigger = ({ children }: any) =>
    React.createElement('span', { onClick: React.useContext(MenuContext).toggle }, children)
  const MenuPopover = ({ children }: any) =>
    React.useContext(MenuContext).open ? React.createElement('div', null, children) : null
  return {
    __esModule: true,
    ...actual,
    Popover,
    PopoverSurface,
    Menu,
    MenuTrigger,
    MenuPopover
  }
})

import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import moment from 'moment'
import { axeComponent } from 'pp365-jest-config/lib/axe'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import resource from 'SharedResources'
import { Timeline } from '.'
import { ITimelineGroup, ITimelineItem, TimelineGroupType } from '../../../interfaces'
import { formatDate, getContrastRatio, tryParseCurrency } from '../../../util'

const FRISBEE = 'https://contoso.sharepoint.com/sites/frisbee'

/**
 * The amount as `getByText` finds it. `tryParseCurrency` formats in SharePoint's UI language,
 * Norwegian when the page names none, where the thousands separator is a no-break space: Testing
 * Library normalizes the page's text to plain spaces but compares the expected string as given.
 */
const currency = (value: string) => tryParseCurrency(value).replace(/\s+/g, ' ')

const GROUPS: ITimelineGroup[] = [
  { id: 0, title: 'Frisbeegolfbane', type: TimelineGroupType.Project, path: FRISBEE },
  {
    id: 1,
    title: 'Svømmehall',
    type: TimelineGroupType.Project,
    path: 'https://contoso.sharepoint.com/sites/svommehall',
    isProgram: true
  }
] as ITimelineGroup[]

function item(id: number, title: string, data: Record<string, any>): ITimelineItem {
  return {
    id,
    group: 0,
    title,
    start_time: moment('2026-01-05'),
    end_time: moment('2026-12-18'),
    itemProps: { style: {} },
    data
  } as unknown as ITimelineItem
}

const BAR = item(0, 'Prosjekt: Frisbeegolfbane', {
  type: resource.TimelineConfiguration_Project_Title,
  elementType: resource.TimelineConfiguration_Bar_ElementType,
  project: 'Frisbeegolfbane',
  projectUrl: FRISBEE,
  phase: 'Gjennomføring',
  budgetTotal: '100000',
  costsTotal: '20000',
  description: 'Bane med 18 hull',
  tag: 'Idrett',
  bgColorHex: '#0078d4'
})
const MILESTONE = item(1, 'Åpning', {
  type: resource.TimelineConfiguration_Milestone_Title,
  elementType: resource.TimelineConfiguration_Diamond_ElementType
})
const PHASE = item(2, 'Forprosjekt', {
  type: resource.TimelineConfiguration_Phase_Title,
  elementType: resource.TimelineConfiguration_Triangle_ElementType
})

function renderTimeline(props: Record<string, any> = {}) {
  const onFilterChange = jest.fn()
  const onGroupByChange = jest.fn()
  render(
    <Timeline
      title='Prosjekttidslinje'
      infoText='Tidslinjen viser prosjektene'
      groups={GROUPS}
      items={[BAR, MILESTONE, PHASE]}
      filters={[]}
      onFilterChange={onFilterChange}
      onGroupByChange={onGroupByChange}
      {...props}
    />
  )
  return { onFilterChange, onGroupByChange }
}

const calendar = () => screen.getByTestId('calendar')
const details = () => screen.getByRole('dialog')
const button = (name: string) => within(calendar()).getByRole('button', { name })

/** The timeline's grey rows, `rgba(0, 0, 0, 0.05)` over white, the fainter of its backgrounds. */
const GREY_ROW = '#f2f2f2'

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('Timeline', () => {
  it('shows its title and links each project group to its timeline page', () => {
    renderTimeline()
    expect(screen.getByText('Prosjekttidslinje', { selector: 'span' })).toBeInTheDocument()
    expect(screen.getByText('Frisbeegolfbane', { selector: 'a' })).toHaveAttribute(
      'href',
      `${FRISBEE}/SitePages/${strings.ProjectTimelineTitle}.aspx`
    )
    // A program's page is its program timeline.
    expect(screen.getByText('Svømmehall', { selector: 'a' })).toHaveAttribute(
      'href',
      `https://contoso.sharepoint.com/sites/svommehall/SitePages/${strings.ProgramTimelineTitle}.aspx`
    )
  })

  it('shows other groups by their title', () => {
    renderTimeline({ groups: [{ id: 0, title: 'Styring', type: TimelineGroupType.Category }] })
    expect(screen.getByTitle('Styring')).toHaveTextContent('Styring')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('draws a bar with its title, and milestones as diamonds and triangles', () => {
    renderTimeline()
    expect(within(calendar()).getByText('Prosjekt: Frisbeegolfbane')).toBeInTheDocument()
    expect(within(calendar()).queryByText('Åpning')).toBeNull()
    expect(calendar().querySelectorAll('.timelineItemMilestone')).toHaveLength(2)
  })

  it('starts at the time frame it is given', () => {
    renderTimeline({
      defaultTimeframe: [
        [-2, 'months'],
        [6, 'months']
      ]
    })
    expect(calendar()).toHaveAttribute(
      'data-start',
      moment().add(-2, 'months').format('YYYY-MM-DD')
    )
    expect(calendar()).toHaveAttribute('data-end', moment().add(6, 'months').format('YYYY-MM-DD'))
  })

  it('gives the group names room unless the groups are projects grouped by project, or none is wanted', () => {
    renderTimeline()
    expect(calendar()).toHaveAttribute('data-sidebar', '300')
    cleanup()
    renderTimeline({ isGroupByEnabled: true })
    expect(calendar()).toHaveAttribute('data-sidebar', '0')
    cleanup()
    renderTimeline({
      isGroupByEnabled: true,
      groups: [{ id: 0, title: 'Styring', type: TimelineGroupType.Category }]
    })
    expect(calendar()).toHaveAttribute('data-sidebar', '120')
    cleanup()
    renderTimeline({ hideSidebar: true })
    expect(calendar()).toHaveAttribute('data-sidebar', '0')
  })

  it('opens the filter panel with its filters', () => {
    renderTimeline({
      filters: [
        {
          column: { key: 'data.type', fieldName: 'data.type', name: 'Type', minWidth: 0 },
          items: [
            { name: 'Milepæl', value: 'Milepæl' },
            { name: 'Prosjekt', value: 'Prosjekt' }
          ]
        }
      ]
    })
    fireEvent.click(screen.getByRole('button', { name: strings.FilterText }))
    expect(screen.getByRole('checkbox', { name: 'Milepæl', hidden: true })).toBeInTheDocument()
  })

  it('groups by what the user picks, and says what it groups by', () => {
    const { onGroupByChange } = renderTimeline({
      isGroupByEnabled: true,
      defaultGroupBy: resource.TimelineConfiguration_Project_Title
    })
    const label = (groupBy: string) => `${strings.GroupByLabel} ${groupBy}`
    fireEvent.click(screen.getByText(label(resource.TimelineConfiguration_Project_Title)))
    fireEvent.click(screen.getByText(strings.CategoryFieldLabel))
    expect(onGroupByChange).toHaveBeenCalledWith(strings.CategoryFieldLabel)
    expect(screen.getByText(label(strings.CategoryFieldLabel))).toBeInTheDocument()
  })

  it('shows the details of a project bar clicked, and closes them on Escape', () => {
    renderTimeline()
    fireEvent.click(within(calendar()).getByText('Prosjekt: Frisbeegolfbane'))
    expect(within(details()).getByText('Frisbeegolfbane')).toHaveAttribute('href', FRISBEE)
    expect(within(details()).getByText(strings.LastPublishedStatusreport)).toHaveAttribute(
      'href',
      `${FRISBEE}/${resource.Navigation_ProjectStatus_Url}`
    )
    expect(within(details()).getByText('Gjennomføring')).toBeInTheDocument()
    expect(within(details()).getByText(currency('100000'))).toBeInTheDocument()
    expect(within(details()).getByText(currency('20000'))).toBeInTheDocument()
    expect(within(details()).getByText('Bane med 18 hull')).toBeInTheDocument()
    expect(within(details()).getByTitle(strings.TagFieldLabel)).toHaveTextContent('Idrett')
    expect(within(details()).getAllByText(formatDate(BAR.start_time.toString()))).not.toHaveLength(
      0
    )
    fireEvent.keyDown(within(details()).getByText('Gjennomføring'), { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the date of a milestone, and the dates of a phase', () => {
    renderTimeline()
    fireEvent.click(calendar().querySelectorAll('.timelineItemMilestone')[0])
    expect(within(details()).getByText(`${strings.MilestoneDateLabel}:`)).toBeInTheDocument()
    expect(
      within(details()).getByText(formatDate(MILESTONE.end_time.toString()))
    ).toBeInTheDocument()
    fireEvent.keyDown(details(), { key: 'Escape' })
    fireEvent.click(calendar().querySelectorAll('.timelineItemMilestone')[1])
    expect(within(details()).getByText(`${strings.StartDateLabel}:`)).toBeInTheDocument()
    expect(within(details()).getByText(`${strings.EndDateLabel}:`)).toBeInTheDocument()
  })

  it('shows the allocation of a resource', () => {
    const allocation = item(3, 'Kari Nordmann', {
      type: strings.ResourceLabel,
      elementType: resource.TimelineConfiguration_Bar_ElementType,
      project: 'Frisbeegolfbane',
      projectUrl: FRISBEE,
      role: 'Prosjektleder',
      allocation: 50,
      status: 'Tildelt',
      comment: 'Halv stilling',
      resource: 'Kari Nordmann',
      resourceUpn: 'kari@contoso.no',
      department: 'Kultur'
    })
    renderTimeline({ items: [allocation] })
    fireEvent.click(within(calendar()).getByText('Kari Nordmann'))
    expect(within(details()).getByText('Prosjektleder')).toBeInTheDocument()
    expect(within(details()).getByText('50%')).toBeInTheDocument()
    expect(within(details()).getByText('Tildelt')).toBeInTheDocument()
    expect(within(details()).getByText('Halv stilling')).toBeInTheDocument()
    expect(within(details()).getByTitle('kari@contoso.no')).toHaveTextContent('Kari Nordmann')
    expect(within(details()).getByText('Kultur')).toBeInTheDocument()
  })

  it('shows an absence with a link to the resource allocation list', () => {
    const absence = item(4, 'Ferie', {
      type: strings.ResourceAbsenceLabel,
      elementType: resource.TimelineConfiguration_Bar_ElementType,
      role: 'Ferie',
      allocation: 100
    })
    renderTimeline({ items: [absence] })
    fireEvent.click(within(calendar()).getByText('Ferie'))
    expect(within(details()).getByText(resource.Lists_ResourceAllocation_Title)).toHaveAttribute(
      'href',
      resource.Lists_ResourceAllocation_Url
    )
    expect(within(details()).getByText('100%')).toBeInTheDocument()
  })

  it('shows any other element with its description and dates', () => {
    const other = item(5, 'Kontrakt signert', {
      type: 'Leveranse',
      elementType: resource.TimelineConfiguration_Bar_ElementType,
      allocation: 0
    })
    renderTimeline({ items: [other] })
    fireEvent.click(within(calendar()).getByText('Kontrakt signert'))
    expect(within(details()).getAllByText('Kontrakt signert').length).toBeGreaterThan(0)
    expect(within(details()).getByText('0%')).toBeInTheDocument()
  })

  it('opens an item from the keyboard, and gives focus back to it on Escape (WCAG 2.1.1)', () => {
    renderTimeline()
    const bar = within(calendar()).getByRole('button', { name: 'Prosjekt: Frisbeegolfbane' })
    expect(bar).toHaveAttribute('tabindex', '0')
    expect(bar).toHaveAttribute('aria-haspopup', 'dialog')
    bar.focus()
    fireEvent.keyDown(bar, { key: 'Enter' })
    expect(details()).toHaveAccessibleName('Prosjekt: Frisbeegolfbane')
    // Fluent's popover takes focus into the details; Escape there closes them.
    const link = within(details()).getByText('Frisbeegolfbane')
    link.focus()
    fireEvent.keyDown(link, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(bar).toHaveFocus()
    fireEvent.keyDown(within(calendar()).getByRole('button', { name: 'Åpning' }), { key: ' ' })
    expect(within(details()).getByText(`${strings.MilestoneDateLabel}:`)).toBeInTheDocument()
  })

  it('takes the focus into details that hold no link, named by the item and described by what they show (WCAG 2.4.3, 4.1.2)', () => {
    renderTimeline()
    fireEvent.keyDown(within(calendar()).getByRole('button', { name: 'Åpning' }), { key: 'Enter' })
    // Fluent focuses a surface with a tab index as it opens; without one, the focus stayed on the
    // item behind the details of a milestone or a phase, and a screen reader heard nothing open.
    expect(details()).toHaveAttribute('tabindex', '-1')
    expect(details()).toHaveAccessibleName('Åpning')
    const date = formatDate(MILESTONE.end_time.toString())
    expect(details()).toHaveAccessibleDescription(
      expect.stringContaining(`${strings.MilestoneDateLabel}: ${date}`)
    )
  })

  it('names a milestone, which shows no text, by its title (WCAG 4.1.2)', () => {
    renderTimeline()
    expect(within(calendar()).getByRole('button', { name: 'Åpning' })).toBeInTheDocument()
    expect(within(calendar()).getByRole('button', { name: 'Forprosjekt' })).toBeInTheDocument()
  })

  it('lets the keyboard reach the timeline to scroll it, as a named group (WCAG 2.1.1)', async () => {
    renderTimeline()
    const scroll = screen.getByRole('group', { name: strings.Aria.TimelineScrollLabel })
    expect(scroll).toHaveClass('rct-scroll')
    expect(scroll).toHaveAttribute('tabindex', '0')
    expect(await axeComponent(calendar())).toHaveNoViolations()
  })

  it('draws a bar of the timeline configuration in a light tone of its colour, edged in the colour, in black (WCAG 1.4.3, 1.4.11)', () => {
    const bar = (id: number, title: string, background: string) => ({
      ...item(id, title, {
        type: resource.TimelineConfiguration_Project_Title,
        elementType: resource.TimelineConfiguration_Bar_ElementType
      }),
      itemProps: { style: { background, backgroundColor: background, color: '#ffffff' } }
    })
    renderTimeline({
      items: [bar(6, 'Prosjekt', '#f35d69'), bar(7, 'Fase', '#2589d6'), bar(8, 'Mørk', '#1f4e79')]
    })
    // The template's blue stands out against the grey rows by itself (3.33:1) and edges its bar;
    // its red (2.85:1) is darkened until it does.
    expect(button('Fase')).toHaveStyle({
      backgroundColor: '#a8d0ef',
      border: '1px solid #2589d6',
      color: '#000000'
    })
    expect(button('Prosjekt')).toHaveStyle({ backgroundColor: '#fabec3', color: '#000000' })
    const edge = button('Prosjekt').style.borderColor
    expect(getContrastRatio(edge, GREY_ROW)).toBeGreaterThanOrEqual(3)
    expect(getContrastRatio(edge, GREY_ROW)).toBeLessThan(3.1)
    // A tone of a dark colour is light too, so its configured white text gives way to black.
    expect(button('Mørk')).toHaveStyle({ color: '#000000' })
  })

  it('keeps the colour of an item from elsewhere, such as an allocation, in readable text (WCAG 1.4.3)', () => {
    const allocation = (id: number, title: string, background: string) => ({
      ...item(id, title, { type: strings.ResourceLabel, allocation: 80 }),
      itemProps: { style: { background, backgroundColor: background, color: '#ffffff' } }
    })
    renderTimeline({
      items: [allocation(9, 'Kari', 'rgba(51, 153, 51, 0.8)'), allocation(10, 'Ola', '#1f4e79')]
    })
    // The allocation's colour fades with its share, so it is not toned or edged; white on the
    // green at 80 % is 2.6:1, black on it 7.8:1.
    expect(button('Kari')).toHaveStyle({
      backgroundColor: 'rgba(51, 153, 51, 0.8)',
      color: '#000000'
    })
    expect(button('Kari').style.borderStyle).not.toBe('solid')
    expect(button('Ola')).toHaveStyle({ backgroundColor: '#1f4e79', color: '#ffffff' })
  })

  it('edges a milestone in a darker shade of its colour, which stands out on the grey rows (WCAG 1.4.11)', () => {
    const milestone = (
      id: number,
      title: string,
      bgColorHex?: string,
      elementType = resource.TimelineConfiguration_Diamond_ElementType
    ) =>
      item(id, title, {
        type: resource.TimelineConfiguration_Milestone_Title,
        elementType,
        bgColorHex
      })
    renderTimeline({
      items: [
        milestone(11, 'Gul', '#ffc800'),
        milestone(12, 'Blå', '#6495ed'),
        milestone(13, 'Uten farge'),
        milestone(14, 'Trekant', undefined, resource.TimelineConfiguration_Triangle_ElementType)
      ]
    })
    const shape = (name: string) => button(name).firstElementChild as HTMLElement
    const colours = (name: string) => [
      shape(name).style.getPropertyValue('--milestone-fill'),
      shape(name).style.getPropertyValue('--milestone-edge')
    ]
    expect(colours('Gul')).toEqual(['#ffc800', '#ac8700'])
    // At least a quarter darker, so the edge shows round a colour that stands out by itself.
    expect(colours('Blå')).toEqual(['#6495ed', '#4b70b2'])
    // The default colours: the template's yellow for a diamond, light blue for a triangle.
    expect(colours('Uten farge')).toEqual(['#ffc800', '#ac8700'])
    expect(shape('Uten farge')).toHaveClass('diamond')
    const [fill, edge] = colours('Trekant')
    expect(fill).toBe('#add8e6')
    expect(getContrastRatio(edge, GREY_ROW)).toBeGreaterThanOrEqual(3)
    expect(shape('Trekant')).toHaveClass('triangle')
  })

  it('writes the tag in the details in a colour readable on the item colour (WCAG 1.4.3)', () => {
    const tagged = (id: number, title: string, bgColorHex: string) =>
      item(id, title, {
        type: resource.TimelineConfiguration_Project_Title,
        elementType: resource.TimelineConfiguration_Bar_ElementType,
        tag: 'Idrett',
        bgColorHex
      })
    renderTimeline({ items: [tagged(15, 'Rød', '#f35d69'), tagged(16, 'Blå', '#0078d4')] })
    fireEvent.click(button('Rød'))
    expect(within(details()).getByTitle(strings.TagFieldLabel)).toHaveStyle({ color: '#000000' })
    fireEvent.keyDown(details(), { key: 'Escape' })
    fireEvent.click(button('Blå'))
    expect(within(details()).getByTitle(strings.TagFieldLabel)).toHaveStyle({ color: '#ffffff' })
  })
})
