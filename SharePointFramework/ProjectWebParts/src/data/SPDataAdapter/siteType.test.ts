import { isParentSiteType, readSiteType } from './siteType'

/**
 * What kind of site a project site is, from the flags of its properties item. Usage statistics
 * count by it, and the matrix web parts ask it whether the site has child projects.
 */
describe('readSiteType', () => {
  it('tells a program, a parent project and a project apart, a program first', async () => {
    const read = (flags: Record<string, any>) => readSiteType(() => Promise.resolve([flags]))
    expect(await read({ GtIsProgram: true, GtIsParentProject: true })).toBe('program')
    expect(await read({ GtIsProgram: true })).toBe('program')
    expect(await read({ GtIsParentProject: true })).toBe('parent')
    expect(await read({ GtIsProgram: false, GtIsParentProject: false })).toBe('project')
    expect(await read({})).toBe('project')
  })

  it('takes a site whose properties item is not there yet for a project', async () => {
    expect(await readSiteType(() => Promise.resolve([]))).toBe('project')
  })

  it('answers other when the flags cannot be read, as on a site without the list', async () => {
    const notFound = Object.assign(new Error('List does not exist.'), { status: 404 })
    expect(await readSiteType(() => Promise.reject(notFound))).toBe('other')
    expect(
      await readSiteType(() => {
        throw new Error('Ingen klient')
      })
    ).toBe('other')
  })

  it('reads the flags once for each call', async () => {
    const readFlags = jest.fn(() => Promise.resolve([{ GtIsProgram: true }]))
    await readSiteType(readFlags)
    expect(readFlags).toHaveBeenCalledTimes(1)
  })
})

describe('isParentSiteType', () => {
  it('is true for a program and a parent project, the sites with child projects', () => {
    const siteTypes = ['program', 'parent', 'project', 'other'] as const
    expect(siteTypes.filter((siteType) => isParentSiteType(siteType))).toEqual([
      'program',
      'parent'
    ])
  })
})
