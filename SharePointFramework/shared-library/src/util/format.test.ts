import { format } from './format'

/**
 * Verbatim copy of Fluent UI v8's `format` (`@fluentui/utilities/lib/string.js`,
 * 8.17.2), kept here as the oracle for the differential test below. `format` in
 * `./format` replaces it across the six solutions, and "identical semantics"
 * includes the quirks, so the two are compared rather than described.
 */
function v8Format(s: string, ...values: any[]): string {
  const args = values
  function replaceFunc(match: string): string {
    let replacement = args[match.replace(/[{}]/g, '') as any]
    if (replacement === null || replacement === undefined) {
      replacement = ''
    }
    return replacement
  }
  return s.replace(/\{\d+\}/g, replaceFunc)
}

describe('format', () => {
  it('substitutes a single token', () => {
    expect(format('Prosjekt {0} ble opprettet', 'Alpha')).toBe('Prosjekt Alpha ble opprettet')
  })

  it('substitutes several tokens in any order', () => {
    expect(format('{1} av {0}', 10, 3)).toBe('3 av 10')
  })

  it('substitutes the same token more than once', () => {
    expect(format('{0} og {0}', 'x')).toBe('x og x')
  })

  it('renders a missing argument as an empty string', () => {
    expect(format('a{0}b')).toBe('ab')
    expect(format('a{3}b', 'only-one')).toBe('ab')
  })

  it('renders null and undefined as an empty string', () => {
    expect(format('a{0}b', null)).toBe('ab')
    expect(format('a{0}b', undefined)).toBe('ab')
  })

  it('keeps falsy values that are not null or undefined', () => {
    // The v8 check is `=== null || === undefined`, so 0, false and '' survive.
    expect(format('{0}', 0)).toBe('0')
    expect(format('{0}', false)).toBe('false')
    expect(format('{0}', '')).toBe('')
    expect(format('{0}', NaN)).toBe('NaN')
  })

  it('coerces non-string values', () => {
    expect(format('{0}', 42)).toBe('42')
    expect(format('{0}', ['a', 'b'])).toBe('a,b')
    expect(format('{0}', new Date(Date.UTC(2026, 0, 1)).getUTCFullYear())).toBe('2026')
  })

  it('leaves tokens that are not {digits} untouched', () => {
    expect(format('{a}', 'x')).toBe('{a}')
    expect(format('{}', 'x')).toBe('{}')
    expect(format('{ 0 }', 'x')).toBe('{ 0 }')
    expect(format('{{0}}', 'x')).toBe('{x}')
  })

  it('supports multi-digit indices', () => {
    const args = Array.from({ length: 12 }, (_, i) => `v${i}`)
    expect(format('{10}', ...args)).toBe('v10')
  })

  it('renders a leading-zero index as an empty string, as v8 does', () => {
    // v8 indexes the arguments with the token's own digits, so '00' is a miss
    // rather than index 0. Preserved deliberately; see the comment in format.ts.
    expect(format('{00}', 'first')).toBe('')
  })

  it('treats $-sequences in a replacement as literal text', () => {
    // The value is returned from a replacer function, so `$&` and `$1` are not
    // expanded the way they would be in a string replacement pattern.
    expect(format('{0}', '$& $1 $$')).toBe('$& $1 $$')
  })

  it('returns a string without tokens unchanged', () => {
    expect(format('ingen tokens her')).toBe('ingen tokens her')
    expect(format('')).toBe('')
  })

  it('matches Fluent UI v8 on every case above', () => {
    const cases: Array<[string, any[]]> = [
      ['Prosjekt {0} ble opprettet', ['Alpha']],
      ['{1} av {0}', [10, 3]],
      ['{0} og {0}', ['x']],
      ['a{0}b', []],
      ['a{3}b', ['only-one']],
      ['a{0}b', [null]],
      ['a{0}b', [undefined]],
      ['{0}', [0]],
      ['{0}', [false]],
      ['{0}', ['']],
      ['{0}', [NaN]],
      ['{0}', [42]],
      ['{0}', [['a', 'b']]],
      ['{a}', ['x']],
      ['{}', ['x']],
      ['{ 0 }', ['x']],
      ['{{0}}', ['x']],
      ['{10}', Array.from({ length: 12 }, (_, i) => `v${i}`)],
      ['{00}', ['first']],
      ['{0}', ['$& $1 $$']],
      ['ingen tokens her', []],
      ['', []],
      ['{0}-{1}-{2}', ['a', null, 'c']]
    ]
    for (const [template, args] of cases) {
      expect(format(template, ...args)).toBe(v8Format(template, ...args))
    }
  })
})
