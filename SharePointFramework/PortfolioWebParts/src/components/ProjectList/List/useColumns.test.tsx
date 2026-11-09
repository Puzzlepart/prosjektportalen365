// jest.mock must come before the imports: Heft runs Jest on TypeScript's CommonJS output without
// Babel, so mocks are not hoisted. The row menu needs the data adapter and the whole web part
// context, as in List.test.tsx.
jest.mock('../ProjectMenu', () => ({ ProjectMenu: () => null }))

import { Link } from '@fluentui/react-components'
import { renderHook } from '@testing-library/react'
import * as strings from 'PortfolioWebPartsStrings'
import * as React from 'react'
import { IListContext, ListContext } from './context'
import { useColumns } from './useColumns'

/**
 * The project list's columns as the list view gets them: their headers from the configured
 * project columns, which metadata they show, and what each cell holds for a project. The cells
 * are read as the elements they make; the list itself is rendered in List.test.tsx.
 */
const PROJECT_COLUMNS = [
  {
    internalName: 'GtProjectServiceArea',
    fieldName: 'GtProjectServiceAreaText',
    name: 'Tjenesteområde'
  },
  { internalName: 'GtProjectType', fieldName: 'GtProjectTypeOWSTEXT', name: 'Prosjekttype' },
  { internalName: 'GtProjectManager', fieldName: 'GtProjectManagerOWSUSER', name: 'Prosjektleder' }
]

function columnsWith(context: Partial<IListContext> = {}) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ListContext.Provider
      value={{ projects: [], projectColumns: PROJECT_COLUMNS, size: 'medium', ...context } as any}
    >
      {children}
    </ListContext.Provider>
  )
  const columns = renderHook(() => useColumns(), { wrapper }).result.current
  return (id: string) => columns.find((column) => column.columnId === id)
}

const project = (overrides: Record<string, any> = {}) =>
  ({
    title: 'Ny svømmehall',
    url: '/sites/svommehall',
    hasUserAccess: true,
    phase: 'Gjennomføre',
    data: {},
    primaryUser: { name: 'Kari Nordmann' },
    secondaryUser: { name: 'Ola Nordmann' },
    ...overrides
  }) as any

/** The tags a field cell shows: its tag menu's tags, and whether the menu is hidden. */
function tagsOf(cell: React.ReactElement) {
  const menu = (cell.props as any).children
  return { tags: menu.props.tags, hidden: menu.props.hidden }
}

describe('the project list columns', () => {
  it('shows every column, unless the web part leaves some metadata out', () => {
    const allIds = [
      'logo',
      'title',
      'phase',
      'primaryField',
      'secondaryField',
      'primaryUserRole',
      'secondaryUserRole',
      'actions'
    ]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ListContext.Provider value={{ projectColumns: [], size: 'medium' } as any}>
        {children}
      </ListContext.Provider>
    )
    expect(
      renderHook(() => useColumns(), { wrapper }).result.current.map((c) => c.columnId)
    ).toEqual(allIds)
    const noPeople = ({ children }: { children: React.ReactNode }) => (
      <ListContext.Provider
        value={
          {
            projectColumns: [],
            size: 'medium',
            shouldDisplay: (key: string) => !/User/.test(key)
          } as any
        }
      >
        {children}
      </ListContext.Provider>
    )
    expect(
      renderHook(() => useColumns(), { wrapper: noPeople }).result.current.map((c) => c.columnId)
    ).toEqual(['logo', 'title', 'phase', 'primaryField', 'secondaryField', 'actions'])
  })

  it('heads a configured field with its project column, found by internal or field name, else with the default label', () => {
    const column = columnsWith({
      primaryField: 'GtProjectServiceArea',
      secondaryField: 'GtProjectTypeOWSTEXT',
      primaryUserField: 'GtProjectManager',
      secondaryUserField: 'GtNotAColumn'
    })
    expect(column('primaryField').renderHeaderCell()).toBe('Tjenesteområde')
    expect(column('secondaryField').renderHeaderCell()).toBe('Prosjekttype')
    expect(column('primaryUserRole').renderHeaderCell()).toBe('Prosjektleder')
    expect(column('secondaryUserRole').renderHeaderCell()).toBe(strings.SecondaryUserFieldLabel)
    const defaults = columnsWith()
    expect(defaults('primaryField').renderHeaderCell()).toBe(strings.PrimaryFieldLabel)
    expect(defaults('secondaryField').renderHeaderCell()).toBe(strings.SecondaryFieldLabel)
    expect(defaults('primaryUserRole').renderHeaderCell()).toBe(strings.PrimaryUserFieldLabel)
    expect(defaults('title').renderHeaderCell()).toBe(strings.TitleLabel)
    expect(defaults('phase').renderHeaderCell()).toBe(strings.PhaseLabel)
    expect(defaults('logo').renderHeaderCell()).toBeNull()
    expect(defaults('actions').renderHeaderCell()).toBeNull()
  })

  it('links the title for a project the user can open, and writes it for one they cannot', () => {
    const column = columnsWith()
    const linked = column('title').renderCell(project()) as React.ReactElement
    expect((linked.props as any).children.type).toBe(Link)
    expect((linked.props as any).children.props.href).toBe('/sites/svommehall')
    const plain = column('title').renderCell(
      project({ hasUserAccess: false })
    ) as React.ReactElement
    expect((plain.props as any).children.type).toBe(React.Fragment)
  })

  it('writes the phase, or nothing without one', () => {
    const column = columnsWith()
    expect((column('phase').renderCell(project()) as any).props.children).toBe('Gjennomføre')
    expect((column('phase').renderCell(project({ phase: undefined })) as any).props.children).toBe(
      ''
    )
  })

  it("tags a field's values from the field, else from its text, and hides the tags without values", () => {
    const column = columnsWith({
      primaryField: 'GtProjectServiceArea',
      secondaryField: 'GtProjectType'
    })
    const cell = (id: string, data: any) => tagsOf(column(id).renderCell(project({ data })) as any)
    expect(cell('primaryField', { GtProjectServiceArea: 'Kultur;Idrett' })).toEqual({
      tags: ['Kultur', 'Idrett'],
      hidden: false
    })
    // An empty or non-text value falls back to the field's text.
    expect(
      cell('primaryField', { GtProjectServiceArea: '', GtProjectServiceAreaText: 'Kultur' })
    ).toEqual({
      tags: ['Kultur'],
      hidden: false
    })
    expect(cell('secondaryField', { GtProjectType: 42, GtProjectTypeText: 'Bygg;Anlegg' })).toEqual(
      {
        tags: ['Bygg', 'Anlegg'],
        hidden: false
      }
    )
    expect(cell('secondaryField', { GtProjectType: 42 })).toEqual({ tags: [], hidden: true })
    // No field configured, or a project without data: no tags.
    expect(tagsOf(columnsWith()('primaryField').renderCell(project()) as any)).toEqual({
      tags: [],
      hidden: true
    })
    expect(tagsOf(column('primaryField').renderCell(project({ data: undefined })) as any)).toEqual({
      tags: [],
      hidden: true
    })
  })

  it('titles a person cell with the role and the person, or the role and "not set"', () => {
    const column = columnsWith({ primaryUserField: 'GtProjectManager' })
    expect((column('primaryUserRole').renderCell(project()) as any).props.title).toBe(
      'Prosjektleder: Kari Nordmann'
    )
    expect(
      (column('primaryUserRole').renderCell(project({ primaryUser: undefined })) as any).props.title
    ).toBe(`Prosjektleder: ${strings.NotSet}`)
    expect(
      (column('secondaryUserRole').renderCell(project({ secondaryUser: undefined })) as any).props
        .title
    ).toBe(`${strings.SecondaryUserFieldLabel}: ${strings.NotSet}`)
  })

  it('draws the logo, avatars and menu smaller in the smaller list sizes', () => {
    for (const [size, logo, avatar, menu] of [
      ['medium', '48px', 32, 'medium'],
      ['small', '32px', 24, 'small']
    ] as const) {
      const column = columnsWith({ size })
      // The logo sits in a wrapper hidden from screen readers, beside the title's link.
      expect((column('logo').renderCell(project()) as any).props.children.props.size).toBe(logo)
      expect(
        (column('primaryUserRole').renderCell(project()) as any).props.children[0].props.size
      ).toBe(avatar)
      expect(
        (column('secondaryUserRole').renderCell(project()) as any).props.children[0].props.size
      ).toBe(avatar)
      expect((column('actions').renderCell(project()) as any).props.children.props.size).toBe(menu)
    }
  })

  it('sorts by title, phase and people, treating a missing value as empty, and leaves the rest unsorted', () => {
    const column = columnsWith()
    const a = project({
      title: 'Alfa',
      phase: 'Konsept',
      primaryUser: { name: 'Anne' },
      secondaryUser: { name: 'Bjørn' }
    })
    const empty = project({
      title: undefined,
      phase: undefined,
      primaryUser: undefined,
      secondaryUser: undefined
    })
    expect(column('title').compare(a, empty)).toBeGreaterThan(0)
    expect(column('title').compare(empty, empty)).toBe(0)
    expect(column('phase').compare(empty, a)).toBeLessThan(0)
    expect(column('primaryUserRole').compare(a, empty)).toBeGreaterThan(0)
    expect(column('secondaryUserRole').compare(empty, a)).toBeLessThan(0)
    expect(column('logo').compare(a, empty)).toBeNull()
    for (const id of ['primaryField', 'secondaryField', 'actions']) {
      expect(column(id).compare(a, empty)).toBe(-1)
    }
  })
})
