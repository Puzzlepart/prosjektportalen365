import { readSiteType } from './siteType'

/**
 * What kind of site a project site is, from the flags of the item that holds them: the site's
 * own properties item (ProjectWebParts) or its row in the hub's Prosjekter list
 * (`PortalDataService.getSiteKind`). Usage statistics count by it, and one mapping gives it
 * wherever the flags are read.
 */
describe('readSiteType', () => {
  it('tells a program, a parent project and a project apart, a program first', async () => {
    const read = (flags: Record<string, any>) => readSiteType(() => Promise.resolve([flags]))
    expect(await read({ GtIsProgram: true, GtIsParentProject: true })).toBe('program')
    expect(await read({ GtIsProgram: true })).toBe('program')
    expect(await read({ GtIsParentProject: true })).toBe('parent')
    expect(await read({ GtIsProgram: false, GtIsParentProject: false })).toBe('project')
    expect(await read({ GtIsProgram: null, GtIsParentProject: null })).toBe('project')
    expect(await read({})).toBe('project')
  })

  it('takes a site whose properties item is not there yet for a project', async () => {
    expect(await readSiteType(() => Promise.resolve([]))).toBe('project')
  })

  it("takes a site without a row in the hub's list for what the caller says: no project of the hub", async () => {
    expect(await readSiteType(() => Promise.resolve([]), 'other')).toBe('other')
    expect(await readSiteType(() => Promise.resolve(undefined), 'other')).toBe('other')
    // A row there is read the same way, whatever a missing one would give.
    expect(await readSiteType(() => Promise.resolve([{ GtIsProgram: true }]), 'other')).toBe(
      'program'
    )
    expect(await readSiteType(() => Promise.resolve([{}]), 'other')).toBe('project')
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
