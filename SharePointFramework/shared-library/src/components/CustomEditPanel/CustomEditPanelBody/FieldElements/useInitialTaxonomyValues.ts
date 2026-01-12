import { useCallback } from 'react'
import { useCustomEditPanelContext } from '../../context'

interface ITermLabel {
  name: string
  isDefault: boolean
  languageTag: string
}

interface ITagTerm {
  key: string
  name: string
}

interface IModernTaxonomyTerm {
  id: string
  labels: ITermLabel[]
}

export type Term = ITagTerm | IModernTaxonomyTerm

export const useInitialTaxonomyValues = () => {
  const context = useCustomEditPanelContext()
  const currentLocale =
    context?.props?.dataAdapter?.spfxContext?.pageContext?.cultureInfo?.currentUICultureName ??
    'en-US'

  const ensureLanguageSupport = useCallback(
    (labels: ITermLabel[] = []) => {
      if (!labels || !labels.length) return []
      const validLabels = labels.filter((label) => label && label.name)
      if (!validLabels.length) return []
      
      const normalized = validLabels.map((label) => ({ ...label }))
      const ensureLabel = (languageTag: string) => {
        if (!languageTag) return
        const toLower = languageTag.toLowerCase()
        const matches = normalized.filter(
          (label) => label.languageTag?.toLowerCase() === toLower
        )
        if (!matches.length) {
          const base = normalized.find((label) => label.isDefault) ?? normalized[0]
          if (!base || !base.name) return
          normalized.push({
            ...base,
            isDefault: true,
            languageTag
          })
          return
        }
        if (!matches.some((label) => label.isDefault)) {
          matches[0].isDefault = true
        }
      }
      ensureLabel(currentLocale)
      ensureLabel('en-US')
      return normalized
    },
    [currentLocale]
  )

  const mapInitialValues = useCallback((term: Term) => {
    if (!term) return null
    
    if ('id' in term) {
      if (!term.labels || !Array.isArray(term.labels)) {
        console.warn('Term has no valid labels array:', term)
        return null
      }
      
      const labels = ensureLanguageSupport(term.labels)
      if (!labels || labels.length === 0 || !labels[0]?.name) {
        console.warn('Term labels could not be processed:', term)
        return null
      }
      return { labels, id: term.id }
    } else {
      if (!term.name) {
        console.warn('Tag term has no name:', term)
        return null
      }
      const labels = ensureLanguageSupport([
        { name: term.name, isDefault: true, languageTag: currentLocale }
      ])
      if (!labels || labels.length === 0) {
        console.warn('Could not create labels for tag term:', term)
        return null
      }
      return { labels, id: term.key }
    }
  }, [ensureLanguageSupport, currentLocale])

  return mapInitialValues
}
