import { getMissingListFields } from './listFields'

const field = (InternalName: string, TypeAsString = 'Text') => ({ InternalName, TypeAsString })

describe('getMissingListFields', () => {
  it("gives the hub list's fields that the project site's list lacks, in the hub's order", () => {
    const hubFields = [
      field('GtStatusTime', 'Choice'),
      field('GtAiStatus'),
      field('GtAiStatusScoreNumber', 'Number'),
      field('GtAiProcessedDateTime', 'DateTime')
    ]
    expect(getMissingListFields(hubFields, ['Title', 'GtStatusTime'])).toEqual(hubFields.slice(1))
  })

  it('leaves out a lookup, which looks up in a list on the hub', () => {
    const hubFields = [field('GtSiteIdLookup', 'Lookup'), field('GtTags', 'LookupMulti')]
    expect(getMissingListFields(hubFields, [])).toEqual([])
  })

  it('gives nothing when the list has every field, and for a hub list without fields', () => {
    expect(getMissingListFields([field('GtAiStatus')], ['GtAiStatus'])).toEqual([])
    expect(getMissingListFields([], ['Title'])).toEqual([])
    expect(getMissingListFields(undefined, undefined)).toEqual([])
    // A field without an internal name cannot be told from one the list has.
    expect(getMissingListFields([field('')], [])).toEqual([])
  })
})
