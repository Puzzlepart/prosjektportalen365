import strings from 'SharedLibraryStrings'
import shared from 'SharedResources'

/**
 * Proves that SPFx string modules resolve in tests the way they do at runtime: through
 * config/config.json "localizedResources" to the nb-no bundle (see pp365-jest-config/lib/resolver.js).
 * It also parses both bundles, so a syntax slip in a loc file fails the build here.
 */
describe('localized string modules', () => {
  it('resolves SharedLibraryStrings to the Norwegian bundle', () => {
    expect(typeof strings).toBe('object')
    expect(Object.keys(strings).length).toBeGreaterThan(50)
    // Bundles may group strings (Aria, Placeholder, Validation); every leaf must be a string.
    const leaves = (value: unknown): unknown[] =>
      value && typeof value === 'object' ? Object.values(value).flatMap(leaves) : [value]
    expect(leaves(strings).every((value) => typeof value === 'string')).toBe(true)
  })

  it('resolves SharedResources', () => {
    expect(typeof shared).toBe('object')
    expect(Object.keys(shared).length).toBeGreaterThan(10)
  })
})
