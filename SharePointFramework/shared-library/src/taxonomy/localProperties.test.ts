import {
  getLocalizedProperty,
  getLocalProperties,
  getLocalProperty,
  getTermLabel,
  TERM_LABEL_FALLBACK_LANGUAGE_TAGS
} from './localProperties'
import { ITermInfo } from './types'

const PHASE_SET_ID = '9c69b57f-1a1b-4d1c-9a2e-2d9a0d7a0001'
const OTHER_SET_ID = '9c69b57f-1a1b-4d1c-9a2e-2d9a0d7a0002'

/**
 * Builds a term shaped like the term store returns it from
 * `sets/{id}/terms?$select=*,localProperties`. Hand rolled on purpose: the point is
 * to pin the response shape our models read, not to exercise PnPjs.
 */
function term(overrides: Partial<ITermInfo> = {}): ITermInfo {
  return {
    id: 'aaaa1111-0000-0000-0000-000000000001',
    childrenCount: 0,
    createdDateTime: '2024-01-01T00:00:00Z',
    lastModifiedDateTime: '2024-01-01T00:00:00Z',
    descriptions: [],
    isDeprecated: false,
    isAvailableForTagging: [{ setId: PHASE_SET_ID, isAvailable: true }],
    labels: [
      { name: 'Konsept', isDefault: true, languageTag: 'nb-NO' },
      { name: 'Concept', isDefault: true, languageTag: 'en-US' }
    ],
    localProperties: [
      {
        setId: PHASE_SET_ID,
        properties: [
          { key: 'PhaseLetter', value: 'K' },
          { key: 'PhaseSubText', value: 'Konseptfase' },
          { key: 'PhaseSubText_en-us', value: 'Concept phase' },
          { key: 'ShowOnFrontpage', value: 'true' }
        ]
      },
      {
        setId: OTHER_SET_ID,
        properties: [{ key: 'PhaseLetter', value: 'X' }]
      }
    ],
    ...overrides
  }
}

describe('getLocalProperties', () => {
  it('returns the properties scoped to the requested term set', () => {
    expect(getLocalProperties(term(), PHASE_SET_ID)).toEqual({
      PhaseLetter: 'K',
      PhaseSubText: 'Konseptfase',
      'PhaseSubText_en-us': 'Concept phase',
      ShowOnFrontpage: 'true'
    })
  })

  it('does not leak properties from another term set the term is reused in', () => {
    expect(getLocalProperties(term(), OTHER_SET_ID)).toEqual({ PhaseLetter: 'X' })
  })

  it('matches the term set ID regardless of casing or braces', () => {
    expect(getLocalProperties(term(), `{${PHASE_SET_ID.toUpperCase()}}`).PhaseLetter).toBe('K')
  })

  it('returns an empty record when the term has no entry for the set', () => {
    expect(getLocalProperties(term(), '9c69b57f-1a1b-4d1c-9a2e-2d9a0d7a0009')).toEqual({})
  })

  it('returns an empty record when localProperties was not selected', () => {
    expect(getLocalProperties(term({ localProperties: undefined }), PHASE_SET_ID)).toEqual({})
  })

  it('returns an empty record instead of throwing for a missing term or term set', () => {
    expect(getLocalProperties(undefined, PHASE_SET_ID)).toEqual({})
    expect(getLocalProperties(term(), undefined)).toEqual({})
    expect(getLocalProperties(term(), '')).toEqual({})
  })
})

describe('getLocalProperty', () => {
  it('reads a single property', () => {
    expect(getLocalProperty(term(), PHASE_SET_ID, 'PhaseLetter')).toBe('K')
  })

  it('returns undefined for a property that is not set', () => {
    expect(getLocalProperty(term(), PHASE_SET_ID, 'Archiveable')).toBeUndefined()
  })

  it('reads a property provisioned with an empty value as set, not as absent', () => {
    const blank = term({
      localProperties: [{ setId: PHASE_SET_ID, properties: [{ key: 'PhaseSubText', value: '' }] }]
    })
    expect(getLocalProperty(blank, PHASE_SET_ID, 'PhaseSubText')).toBe('')
  })

  it('reads an empty value through the case insensitive match too', () => {
    const blank = term({
      localProperties: [{ setId: PHASE_SET_ID, properties: [{ key: 'phasesubtext', value: '' }] }]
    })
    expect(getLocalProperty(blank, PHASE_SET_ID, 'PhaseSubText')).toBe('')
  })
})

describe('getLocalizedProperty', () => {
  it('prefers the language suffixed variant', () => {
    expect(getLocalizedProperty(term(), PHASE_SET_ID, 'PhaseSubText', 'en-us')).toBe(
      'Concept phase'
    )
  })

  it('matches the suffix case insensitively', () => {
    expect(getLocalizedProperty(term(), PHASE_SET_ID, 'PhaseSubText', 'en-US')).toBe(
      'Concept phase'
    )
  })

  it('falls back to the unsuffixed property when there is no localized variant', () => {
    expect(getLocalizedProperty(term(), PHASE_SET_ID, 'PhaseSubText', 'nb-no')).toBe('Konseptfase')
  })

  it('falls back to the unsuffixed property when no language is known', () => {
    expect(getLocalizedProperty(term(), PHASE_SET_ID, 'PhaseLetter', undefined)).toBe('K')
  })

  it('returns undefined when neither variant exists', () => {
    expect(getLocalizedProperty(term(), PHASE_SET_ID, 'PhaseDescription', 'nb-no')).toBeUndefined()
  })

  it('honours a deliberately blank localized override instead of resurrecting the default', () => {
    const suppressed = term({
      localProperties: [
        {
          setId: PHASE_SET_ID,
          properties: [
            { key: 'PhaseSubText', value: 'Konseptfase' },
            { key: 'PhaseSubText_en-us', value: '' }
          ]
        }
      ]
    })
    expect(getLocalizedProperty(suppressed, PHASE_SET_ID, 'PhaseSubText', 'en-us')).toBe('')
  })
})

describe('getTermLabel', () => {
  it('returns the label for the requested language', () => {
    expect(getTermLabel(term(), 'nb-NO')).toBe('Konsept')
    expect(getTermLabel(term(), 'en-US')).toBe('Concept')
  })

  it('compares language tags case insensitively', () => {
    expect(getTermLabel(term(), 'nb-no')).toBe('Konsept')
    expect(getTermLabel(term(), 'en-us')).toBe('Concept')
  })

  it('steps through nb-NO before en-US when the requested language is missing', () => {
    expect(getTermLabel(term(), 'sv-SE')).toBe('Konsept')
    expect(getTermLabel(term(), undefined)).toBe('Konsept')
    expect(getTermLabel(term(), '')).toBe('Konsept')
  })

  it('falls back to en-US when the term has no Norwegian label', () => {
    const englishOnly = term({
      labels: [
        { name: 'Konzept', isDefault: false, languageTag: 'de-DE' },
        { name: 'Concept', isDefault: true, languageTag: 'en-US' }
      ]
    })
    expect(getTermLabel(englishOnly, 'sv-SE')).toBe('Concept')
  })

  it('prefers the requested language over the fixed fallbacks on an English web', () => {
    expect(getTermLabel(term(), 'en-US')).toBe('Concept')
  })

  it('falls back to the first label when none of the languages are present', () => {
    const otherLanguage = term({
      labels: [{ name: 'Konzept', isDefault: true, languageTag: 'de-DE' }]
    })
    expect(getTermLabel(otherLanguage, 'sv-SE')).toBe('Konzept')
  })

  it('prefers the default label over a synonym in the same language', () => {
    const withSynonym = term({
      labels: [
        { name: 'Idé', isDefault: false, languageTag: 'nb-NO' },
        { name: 'Konsept', isDefault: true, languageTag: 'nb-NO' }
      ]
    })
    expect(getTermLabel(withSynonym, 'nb-NO')).toBe('Konsept')
  })

  it('returns an empty string for a term without labels', () => {
    expect(getTermLabel(term({ labels: [] }), 'nb-NO')).toBe('')
    expect(getTermLabel(undefined, 'nb-NO')).toBe('')
  })

  it('documents the fixed fallback order', () => {
    expect(TERM_LABEL_FALLBACK_LANGUAGE_TAGS).toEqual(['nb-NO', 'en-US'])
  })
})
