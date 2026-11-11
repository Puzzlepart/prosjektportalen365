import {
  buildTaxonomyTree,
  collectExpandablePaths,
  hasSelectedDescendant,
  isTaxonomyColumn,
  shouldRenderAsHierarchy
} from './taxonomyHierarchy'

const item = (value: string) => ({ name: value, value })

describe('taxonomyHierarchy', () => {
  it('knows a taxonomy column by its data type, wherever the column keeps it', () => {
    expect(isTaxonomyColumn({ key: 'a', fieldName: 'a', dataType: 'tags' } as any)).toBe(true)
    expect(isTaxonomyColumn({ key: 'b', fieldName: 'b', data: { type: 'tags' } } as any)).toBe(true)
    expect(isTaxonomyColumn({ key: 'c', fieldName: 'c', data: { renderAs: 'tags' } } as any)).toBe(
      true
    )
    expect(isTaxonomyColumn({ key: 'd', fieldName: 'd', data: { renderAs: 'text' } } as any)).toBe(
      false
    )
    expect(isTaxonomyColumn(undefined)).toBe(false)
  })

  it('renders a taxonomy column as a tree only when a value is a term path', () => {
    const tags = { key: 'tags', fieldName: 'tags', dataType: 'tags' } as any
    expect(shouldRenderAsHierarchy(tags, [item('Helse'), item('Helse:Sykehjem')])).toBe(true)
    expect(shouldRenderAsHierarchy(tags, [item('Helse'), item('Skole')])).toBe(false)
    expect(
      shouldRenderAsHierarchy({ key: 't', fieldName: 't' } as any, [item('Helse:Sykehjem')])
    ).toBe(false)
  })

  it('builds the tree with the levels no value names, sorted at every level', () => {
    const { roots, byPath } = buildTaxonomyTree([
      item('Skole:Ungdomsskole'),
      item('Helse:Sykehjem:Avdeling B'),
      item('Helse:Legevakt'),
      item('Skole')
    ])
    expect(roots.map(({ segment }) => segment)).toEqual(['Helse', 'Skole'])
    const helse = byPath.get('Helse')
    expect(helse.item).toBeUndefined()
    expect(helse.children.map(({ path }) => path)).toEqual(['Helse:Legevakt', 'Helse:Sykehjem'])
    expect(byPath.get('Helse:Sykehjem:Avdeling B')).toMatchObject({
      segment: 'Avdeling B',
      level: 2,
      item: item('Helse:Sykehjem:Avdeling B')
    })
    expect(byPath.get('Skole').item).toEqual(item('Skole'))
  })

  it('expands every branch, and finds a selected node below another', () => {
    const { roots, byPath } = buildTaxonomyTree([item('Helse:Sykehjem:Avdeling B'), item('Skole')])
    expect(Array.from(collectExpandablePaths(roots))).toEqual(['Helse', 'Helse:Sykehjem'])
    const selected = new Set(['Helse:Sykehjem:Avdeling B'])
    expect(hasSelectedDescendant(byPath.get('Helse'), selected)).toBe(true)
    expect(hasSelectedDescendant(byPath.get('Skole'), selected)).toBe(false)
  })
})
