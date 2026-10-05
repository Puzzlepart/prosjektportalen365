import { getScopeLabel, isValidScopeKey, parseSubProjects } from './parseSubProjects'

/**
 * The sub-project ("delprosjekt") configuration: one line per series as `key` or `key|label`,
 * validated, deduplicated, and labelled.
 */
describe('parseSubProjects', () => {
  it('parses keys and labels, falling back to the key as label', () => {
    expect(parseSubProjects('DP1|Delprosjekt 1\nDP2')).toEqual([
      { key: 'DP1', label: 'Delprosjekt 1' },
      { key: 'DP2', label: 'DP2' }
    ])
  })

  it('drops invalid lines and duplicate keys, keeping the first', () => {
    expect(
      parseSubProjects(
        ["Ugyldig'nøkkel", '-Minus', 'x'.repeat(33), '', 'DP1|A', 'dp1|B'].join('\n')
      )
    ).toEqual([{ key: 'DP1', label: 'A' }])
    expect(parseSubProjects(undefined)).toEqual([])
  })

  it('validates a key: non-empty, at most 32 characters, no forbidden characters, not starting with a dash', () => {
    expect(isValidScopeKey('DP1')).toBe(true)
    expect(isValidScopeKey(' DP1 ')).toBe(true)
    expect(isValidScopeKey('')).toBe(false)
    expect(isValidScopeKey('a#b')).toBe(false)
    expect(isValidScopeKey('a%b')).toBe(false)
    expect(isValidScopeKey('-a')).toBe(false)
    expect(isValidScopeKey('x'.repeat(32))).toBe(true)
  })

  it('labels a key from the configuration, case-insensitively, and by itself when unknown', () => {
    const subProjects = parseSubProjects('DP1|Delprosjekt 1')
    expect(getScopeLabel(subProjects, 'dp1')).toBe('Delprosjekt 1')
    expect(getScopeLabel(subProjects, 'DP9')).toBe('DP9')
    expect(getScopeLabel(subProjects, '')).toBe('')
  })
})
