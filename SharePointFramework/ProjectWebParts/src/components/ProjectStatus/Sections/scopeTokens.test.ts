import { SectionModel } from 'pp365-shared-library/lib/models'
import {
  containsScopeTokens,
  escapeXmlValue,
  replaceScopeTokens,
  sectionContainsScopeTokens
} from './scopeTokens'

/**
 * The `{scope}` and `{scopeLabel}` tokens of a section's configuration: found, replaced, and
 * escaped for the CAML they land in.
 */
describe('scopeTokens', () => {
  it('finds the tokens in a value', () => {
    expect(containsScopeTokens('Leveranser {scope}')).toBe(true)
    expect(containsScopeTokens('{scopeLabel}')).toBe(true)
    expect(containsScopeTokens('Leveranser')).toBe(false)
    expect(containsScopeTokens(undefined)).toBe(false)
  })

  it('replaces both tokens with the key and the label', () => {
    expect(replaceScopeTokens('{scopeLabel} ({scope})', 'DP1', 'Delprosjekt 1')).toBe(
      'Delprosjekt 1 (DP1)'
    )
    expect(replaceScopeTokens('{scope}', undefined, undefined)).toBe('')
  })

  it('escapes the characters that would restructure a CAML query', () => {
    expect(escapeXmlValue(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&apos;s&lt;/a&gt;'
    )
  })

  it('tells a scoped section by its list, query or view', () => {
    const scoped = (fields: Record<string, string>) =>
      sectionContainsScopeTokens(new SectionModel({ ContentTypeId: '', ...fields }))
    expect(scoped({ GtSecList: 'Leveranser {scope}' })).toBe(true)
    expect(scoped({ GtSecViewQuery: '<Eq>{scopeLabel}</Eq>' })).toBe(true)
    expect(scoped({ GtSecView: 'Visning {scope}' })).toBe(true)
    expect(scoped({ GtSecList: 'Leveranser' })).toBe(false)
  })
})
