// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The timeline itself has a test of its own; here it records the
// props it gets, which are what the data shaping and the filters decide.
const shown: { props?: any } = {}
jest.mock('./Timeline', () => ({
  ...jest.requireActual('./Timeline'),
  Timeline: (props: any) => {
    shown.props = props
    return null
  }
}))

import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import strings from 'SharedLibraryStrings'
import * as React from 'react'
import { ProjectTimeline } from '.'
import { TimelineConfigurationModel, TimelineContentModel } from '../../models'
import { format } from '../../util'

const FRISBEE = 'https://contoso.sharepoint.com/sites/frisbee'
const POOL = 'https://contoso.sharepoint.com/sites/svommehall'

const configuration = (
  title: string,
  elementType: string,
  timelineFilter: boolean,
  sortOrder: number
) =>
  new TimelineConfigurationModel({
    Title: title,
    GtElementType: elementType,
    GtTimelineFilter: timelineFilter,
    GtSortOrder: sortOrder,
    GtTimelineCategory: 'Styring',
    GtHexColor: '#0078d4',
    GtHexColorText: '#ffffff'
  } as any)

const CONFIG = [
  configuration('Prosjekt', 'Bar', true, 1),
  configuration('Milepæl', 'Diamant', true, 3),
  configuration('Fase', 'Bar', false, 2)
]

const project = (
  siteId: string,
  title: string,
  url: string,
  start = '2026-01-01',
  end = '2026-12-31'
) => ({
  siteId,
  title,
  url,
  startDate: start,
  endDate: end,
  phase: 'Gjennomføring',
  isProgram: false
})

/** A data adapter for the program with Frisbeegolfbane and Svømmehall, and their elements. */
function dataAdapter(overrides: Record<string, any> = {}) {
  const projects = [
    project('s1', 'Frisbeegolfbane', FRISBEE),
    project('s2', 'Svømmehall', POOL, '2026-03-01', '2027-06-30'),
    { ...project('s3', 'Uten datoer', ''), startDate: null, endDate: null }
  ]
  return {
    fetchTimelineConfiguration: jest.fn(() => Promise.resolve(CONFIG)),
    fetchProjects: jest.fn(() => Promise.resolve(projects)),
    fetchTimelineProjectData: jest.fn(() =>
      Promise.resolve({
        configElement: CONFIG[0],
        reports: [{ siteId: 's1', budgetTotal: '100000', costsTotal: '20000' }],
        data: [
          { siteId: 's1', properties: { GtServiceArea: 'Helse', GtIsProgram: '0' } },
          { siteId: 's2', properties: { GtServiceArea: 'Kultur;Idrett', GtIsProgram: '1' } }
        ],
        columns: [
          { internalName: 'GtServiceArea', name: 'Tjenesteområde' },
          { internalName: 'GtIsProgram', name: 'Program' }
        ]
      })
    ),
    fetchTimelineContentItems: jest.fn(() =>
      Promise.resolve([
        new TimelineContentModel(
          's2',
          'Svømmehall',
          'Byggestart',
          'Milepæl',
          '2026-05-01',
          '2026-05-01',
          'Første spadetak',
          'Bygg'
        ).usingConfig(CONFIG[1]),
        new TimelineContentModel(
          's1',
          'Frisbeegolfbane',
          'Forprosjekt',
          'Fase',
          '2026-01-01',
          '2026-03-31'
        ).usingConfig(CONFIG[2])
      ])
    ),
    fetchTimelineAggregatedContent: jest.fn(() => Promise.resolve([])),
    ...overrides
  }
}

function renderTimeline(
  adapter = dataAdapter(),
  siteUrl = 'https://contoso.sharepoint.com/sites/program'
) {
  render(
    <ProjectTimeline
      title='Programtidslinje'
      dataAdapter={adapter as any}
      pageContext={{ site: { absoluteUrl: siteUrl } } as any}
      defaultTimeframeStart='2,months'
      defaultTimeframeEnd='6,months'
    />
  )
  return adapter
}

const filter = (fieldName: string) =>
  shown.props.filters.find((f) => f.column.fieldName === fieldName)
const values = (fieldName: string) => filter(fieldName).items.map(({ name }) => name)

beforeEach(() => {
  shown.props = undefined
})

afterEach(async () => {
  cleanup()
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)))
})

describe('ProjectTimeline', () => {
  it('waits for its data before the timeline is drawn', async () => {
    renderTimeline()
    expect(shown.props).toBeUndefined()
    await waitFor(() => expect(shown.props).toBeDefined())
  })

  it('draws a group per project with dates and a bar per project, and its elements', async () => {
    renderTimeline()
    await waitFor(() => expect(shown.props).toBeDefined())
    expect(shown.props.title).toBe('Programtidslinje')
    expect(shown.props.groups.map(({ title }) => title)).toEqual(['Frisbeegolfbane', 'Svømmehall'])
    const titles = shown.props.items.map(({ title }) => title)
    expect(titles).toEqual(
      expect.arrayContaining([
        format(strings.ProjectTimelineItemInfo, 'Frisbeegolfbane'),
        'Byggestart',
        'Forprosjekt'
      ])
    )
    const bar = shown.props.items.find(
      ({ data }) => data.project === 'Frisbeegolfbane' && data.type === 'Prosjekt'
    )
    expect(bar.data).toMatchObject({
      budgetTotal: '100000',
      costsTotal: '20000',
      projectUrl: FRISBEE
    })
    expect(shown.props.defaultTimeframe).toEqual([
      [-2, 'months'],
      [6, 'months']
    ])
  })

  it("puts the group of the page's own project first", async () => {
    renderTimeline(dataAdapter(), POOL)
    await waitFor(() => expect(shown.props).toBeDefined())
    expect(shown.props.groups.map(({ title }) => title)).toEqual(['Svømmehall', 'Frisbeegolfbane'])
  })

  it("puts the page's own project first when it is the first project of the list", async () => {
    const projects = [project('s2', 'Svømmehall', POOL), project('s1', 'Frisbeegolfbane', FRISBEE)]
    renderTimeline(dataAdapter({ fetchProjects: jest.fn(() => Promise.resolve(projects)) }), POOL)
    await waitFor(() => expect(shown.props).toBeDefined())
    expect(shown.props.groups.map(({ title }) => title)).toEqual(['Svømmehall', 'Frisbeegolfbane'])
  })

  it("puts the page's own project first when another title comes twice", async () => {
    const projects = [
      project('s0', 'Rehabilitering', 'https://contoso.sharepoint.com/sites/rehab'),
      project('s4', 'Rehabilitering', 'https://contoso.sharepoint.com/sites/rehab-2'),
      project('s2', 'Svømmehall', POOL)
    ]
    renderTimeline(dataAdapter({ fetchProjects: jest.fn(() => Promise.resolve(projects)) }), POOL)
    await waitFor(() => expect(shown.props).toBeDefined())
    expect(shown.props.groups.map(({ title }) => title)[0]).toBe('Svømmehall')
  })

  it('offers filters on category, type, tag, project and project information', async () => {
    renderTimeline()
    await waitFor(() => expect(shown.props).toBeDefined())
    expect(values('data.category')).toEqual(['Styring'])
    // Types that the configuration keeps out of the filters are not offered.
    expect(values('data.type')).toEqual(['Milepæl', 'Prosjekt'])
    expect(values('data.tag')).toEqual(['Bygg'])
    expect(values('data.project')).toEqual(['Frisbeegolfbane', 'Svømmehall'])
    expect(values('data.properties.GtServiceArea')).toEqual(['Helse', 'Idrett', 'Kultur'])
    expect(filter('data.properties.GtServiceArea').group).toBe(
      strings.FilterPanelGroupProjectInformation
    )
    expect(values('data.properties.GtIsProgram')).toEqual([strings.BooleanNo, strings.BooleanYes])
  })

  it('narrows the items and the groups to the filter, and widens them again', async () => {
    renderTimeline()
    await waitFor(() => expect(shown.props).toBeDefined())
    const type = filter('data.type')
    act(() => {
      shown.props.onFilterChange(type.column, [{ name: 'Milepæl', value: 'Milepæl' }])
    })
    expect(shown.props.items.map(({ title }) => title)).toEqual(['Byggestart'])
    expect(shown.props.groups.map(({ title }) => title)).toEqual(['Svømmehall'])
    expect(filter('data.type').items.find(({ value }) => value === 'Milepæl').selected).toBe(true)
    act(() => {
      shown.props.onFilterChange(type.column, [])
    })
    expect(shown.props.items).toHaveLength(4)
  })

  it('narrows to the projects that have a value among several in a field', async () => {
    renderTimeline()
    await waitFor(() => expect(shown.props).toBeDefined())
    act(() => {
      shown.props.onFilterChange(filter('data.properties.GtServiceArea').column, [
        { name: 'Idrett', value: 'Idrett' }
      ])
    })
    expect(shown.props.groups.map(({ title }) => title)).toEqual(['Svømmehall'])
  })

  it('says what went wrong when the data cannot be read', async () => {
    renderTimeline(
      dataAdapter({
        fetchTimelineConfiguration: jest.fn(() =>
          Promise.reject(new Error('Ingen tilgang til listen'))
        )
      })
    )
    expect(await screen.findByText('Ingen tilgang til listen')).toBeInTheDocument()
    expect(screen.getByText(strings.ErrorTitle)).toBeInTheDocument()
  })

  it('names the element it could not place on the timeline', async () => {
    const broken = new TimelineContentModel(null, 'Svømmehall', 'Uten område', 'Milepæl')
    renderTimeline(
      dataAdapter({ fetchTimelineContentItems: jest.fn(() => Promise.resolve([broken])) })
    )
    expect(await screen.findByText(/Uten område \(Svømmehall\)/)).toBeInTheDocument()
  })
})
