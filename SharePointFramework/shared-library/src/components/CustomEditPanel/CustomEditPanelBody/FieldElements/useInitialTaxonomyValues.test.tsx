import { render } from '@testing-library/react'
import * as React from 'react'
import { CustomEditPanelContext } from '../../context'
import { useInitialTaxonomyValues } from './useInitialTaxonomyValues'

/**
 * Turns the terms a field holds into what the taxonomy picker takes: every term with a label in
 * the page's language and in en-US, marked as the default.
 */
function mapper(language = 'nb-NO') {
  let map: ReturnType<typeof useInitialTaxonomyValues>
  const Probe: React.FC = () => {
    map = useInitialTaxonomyValues()
    return null
  }
  render(
    <CustomEditPanelContext.Provider
      value={
        {
          props: {
            dataAdapter: {
              spfxContext: { pageContext: { cultureInfo: { currentUICultureName: language } } }
            }
          }
        } as any
      }
    >
      <Probe />
    </CustomEditPanelContext.Provider>
  )
  return map
}

describe('useInitialTaxonomyValues', () => {
  it('gives a stored term labels in the language of the page and in en-US', () => {
    expect(mapper()({ key: 'term-1', name: 'Helse' })).toEqual({
      id: 'term-1',
      labels: [
        { name: 'Helse', isDefault: true, languageTag: 'nb-NO' },
        { name: 'Helse', isDefault: true, languageTag: 'en-US' }
      ]
    })
  })

  it("keeps a picked term's labels, adding the missing language from its default label", () => {
    const term = {
      id: 'term-2',
      labels: [{ name: 'Sports', isDefault: true, languageTag: 'en-US' }]
    }
    expect(mapper('nb-NO')(term).labels).toEqual([
      { name: 'Sports', isDefault: true, languageTag: 'en-US' },
      { name: 'Sports', isDefault: true, languageTag: 'nb-NO' }
    ])
  })

  it('marks a label of the language as the default when none of them is', () => {
    const term = {
      id: 'term-3',
      labels: [
        { name: 'Idrett', isDefault: false, languageTag: 'nb-NO' },
        { name: 'Sports', isDefault: true, languageTag: 'en-US' }
      ]
    }
    expect(mapper('nb-NO')(term).labels[0]).toEqual({
      name: 'Idrett',
      isDefault: true,
      languageTag: 'nb-NO'
    })
  })

  it('drops terms without anything to label them by', () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const map = mapper()
    expect(map(null)).toBeNull()
    expect(map({ key: 'term-4', name: '' })).toBeNull()
    expect(map({ id: 'term-5', labels: undefined })).toBeNull()
    expect(
      map({ id: 'term-6', labels: [{ name: '', isDefault: true, languageTag: 'nb-NO' }] })
    ).toBeNull()
    expect(consoleWarn).toHaveBeenCalledTimes(3)
    consoleWarn.mockRestore()
  })
})
