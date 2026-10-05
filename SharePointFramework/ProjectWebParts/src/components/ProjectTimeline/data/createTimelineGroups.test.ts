import strings from 'ProjectWebPartsStrings'
import { TimelineConfigurationModel, TimelineContentModel } from 'pp365-shared-library/lib/models'
import { TimelineGroupType } from '../types'
import { createTimelineGroups } from './createTimelineGroups'
import { getSelectedGroups } from './getSelectedGroups'

/**
 * The timeline's groups: one for the project, one per category and one per type in the
 * configuration, and which set the default grouping picks.
 */
const config = (Title: string, GtTimelineCategory: string) =>
  new TimelineConfigurationModel({ Title, GtTimelineCategory, GtSortOrder: 1 } as any)

describe('createTimelineGroups', () => {
  const groups = createTimelineGroups(new TimelineContentModel('s1', 'Alfa', 'Alfa', 'Prosjekt'), [
    config('Milepæl', 'Styring'),
    config('Fase', 'Styring'),
    config('Leveranse', 'Leveranser')
  ])

  it('groups by project, by distinct category and by distinct type', () => {
    expect(groups.projectGroups).toEqual([
      { id: 0, title: 'Alfa', type: TimelineGroupType.Project }
    ])
    expect(groups.categoryGroups.map((g) => [g.id, g.title])).toEqual([
      [0, 'Styring'],
      [1, 'Leveranser']
    ])
    expect(groups.typeGroups.map((g) => g.title)).toEqual(['Milepæl', 'Fase', 'Leveranse'])
  })

  it('picks the set the default grouping names', () => {
    expect(getSelectedGroups(groups, strings.CategoryFieldLabel)).toBe(groups.categoryGroups)
    expect(getSelectedGroups(groups, strings.TypeLabel)).toBe(groups.typeGroups)
    expect(getSelectedGroups(groups, 'Prosjekt')).toBe(groups.projectGroups)
  })
})
