import strings from 'ProjectWebPartsStrings'
import { format } from 'pp365-shared-library'
import { TimelineConfigurationModel, TimelineContentModel } from 'pp365-shared-library/lib/models'
import resource from 'SharedResources'
import { transformItems } from './transformItems'

/**
 * The timeline items as the timeline draws them: a bar between its dates in the configured
 * colours, a milestone at its end date, the project item titled after the project, each in the
 * group its type (or category, or project) belongs to.
 */
const bar = new TimelineConfigurationModel({
  Title: 'Leveranse',
  GtTimelineCategory: 'Leveranser',
  GtElementType: resource.TimelineConfiguration_Bar_ElementType,
  GtHexColor: '#112233',
  GtHexColorText: '#ffffff',
  GtSortOrder: 2
} as any)
const milestone = new TimelineConfigurationModel({
  Title: 'Milepæl',
  GtTimelineCategory: 'Styring',
  GtElementType: 'Milepæl',
  GtSortOrder: 1
} as any)

const content = (
  type: string,
  itemTitle: string,
  start: string,
  end: string,
  config: TimelineConfigurationModel
) => new TimelineContentModel('s1', 'Alfa', itemTitle, type, start, end).usingConfig(config)

const groups = [
  { id: 0, title: 'Leveranse' },
  { id: 1, title: 'Milepæl' },
  { id: 2, title: resource.TimelineConfiguration_Project_Title }
]
const props = { defaultGroupBy: strings.TypeLabel, defaultCategory: 'Standard' } as any
/** A moment or a date, as a date. */
const asDate = (value: any) => new Date(value.valueOf())

describe('transformItems', () => {
  it('draws a bar between its dates in its colours, grouped by its type', () => {
    const [item] = transformItems(
      [content('Leveranse', 'Design av bane', '2026-01-10', '2026-03-01', bar)],
      groups,
      props
    )
    expect(item.title).toBe('Design av bane')
    expect(item.group).toBe(0)
    expect(asDate(item.start_time)).toEqual(new Date('2026-01-10'))
    expect(asDate(item.end_time)).toEqual(new Date('2026-03-01'))
    expect(item.itemProps.style).toMatchObject({ background: '#112233', color: '#ffffff' })
    expect(item.data).toMatchObject({
      project: 'Alfa',
      type: 'Leveranse',
      category: 'Leveranser',
      sortOrder: 2,
      elementType: resource.TimelineConfiguration_Bar_ElementType
    })
  })

  it('draws a milestone at its end date, transparent', () => {
    const [item] = transformItems(
      [content('Milepæl', 'Åpning', '2026-05-01', '2026-05-10', milestone)],
      groups,
      props
    )
    expect(item.group).toBe(1)
    expect(asDate(item.start_time)).toEqual(new Date('2026-05-10'))
    expect(item.itemProps.style.background).toBe('transparent')
  })

  it('titles the project item after the project and drops items without a type', () => {
    const projectConfig = new TimelineConfigurationModel({
      Title: resource.TimelineConfiguration_Project_Title,
      GtSortOrder: 0
    } as any)
    const items = transformItems(
      [
        content(
          resource.TimelineConfiguration_Project_Title,
          'Alfa',
          '2026-01-01',
          '2026-12-31',
          projectConfig
        ),
        new TimelineContentModel('s1', 'Alfa', 'Uten type', undefined)
      ],
      groups,
      props
    )
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe(format(strings.ProjectTimelineItemInfo, 'Alfa'))
    expect(items[0].group).toBe(2)
  })

  it('groups by category or by project when the default grouping says so', () => {
    const byCategory = transformItems(
      [content('Leveranse', 'Design', '2026-01-10', '2026-03-01', bar)],
      [{ id: 5, title: 'Leveranser' }],
      { ...props, defaultGroupBy: strings.CategoryFieldLabel }
    )
    expect(byCategory[0].group).toBe(5)
    const byProject = transformItems(
      [content('Leveranse', 'Design', '2026-01-10', '2026-03-01', bar)],
      [{ id: 9, title: 'Alfa' }],
      { ...props, defaultGroupBy: 'Prosjekt' }
    )
    expect(byProject[0].group).toBe(9)
  })

  it('names the item it could not transform', () => {
    expect(() =>
      transformItems([content('Leveranse', 'Design', '2026-01-10', '2026-03-01', bar)], [], props)
    ).toThrow(/Design \(Alfa\)/)
  })
})
