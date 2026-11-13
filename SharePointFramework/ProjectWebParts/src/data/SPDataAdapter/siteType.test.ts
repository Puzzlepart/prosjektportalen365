import { readSiteType } from 'pp365-shared-library/lib/telemetry'
import { isParentSiteType } from './siteType'

/**
 * Whether a project site has child projects, which the matrix web parts ask. The site's type is
 * read by the shared library's `readSiteType`, from the flags of the site's properties item.
 */
describe('isParentSiteType', () => {
  it('is true for a program and a parent project, the sites with child projects', () => {
    const siteTypes = ['program', 'parent', 'project', 'other'] as const
    expect(siteTypes.filter((siteType) => isParentSiteType(siteType))).toEqual([
      'program',
      'parent'
    ])
  })

  it("answers for the site's own properties item as the data adapter reads it", async () => {
    const isParent = (flags: Record<string, any>[]) =>
      readSiteType(() => Promise.resolve(flags)).then(isParentSiteType)
    expect(await isParent([{ GtIsProgram: true }])).toBe(true)
    expect(await isParent([{ GtIsParentProject: true }])).toBe(true)
    expect(await isParent([{ GtIsProgram: false, GtIsParentProject: false }])).toBe(false)
    // A site whose properties item is not there yet is a project, with no child projects.
    expect(await isParent([])).toBe(false)
    // The flags could not be read: `false` on any failure, as before.
    expect(await readSiteType(() => Promise.reject(new Error('404'))).then(isParentSiteType)).toBe(
      false
    )
  })
})
