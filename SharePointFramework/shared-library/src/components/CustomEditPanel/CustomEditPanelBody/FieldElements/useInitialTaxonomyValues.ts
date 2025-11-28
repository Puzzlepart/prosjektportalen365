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
      if (!labels.length) return []
      const normalized = labels.map((label) => ({ ...label }))
      const ensureLabel = (languageTag: string) => {
        if (!languageTag) return
        if (
          !normalized.some(
            (label) => label.languageTag?.toLowerCase() === languageTag.toLowerCase()
          )
        ) {
          const base = normalized.find((label) => label.isDefault) ?? normalized[0]
          normalized.push({
            ...base,
            isDefault: base.languageTag?.toLowerCase() === languageTag.toLowerCase()
              ? base.isDefault
              : false,
            languageTag
          })
        }
      }
      ensureLabel(currentLocale)
      ensureLabel('en-US')
      return normalized
    },
    [currentLocale]
  )

  const mapInitialValues = useCallback((term: Term) => {
    if ('id' in term) {
      return { labels: ensureLanguageSupport(term.labels), id: term.id }
    } else {
      const labels = ensureLanguageSupport([
        { name: term.name, isDefault: true, languageTag: currentLocale }
      ])
      return { labels, id: term.key }
    }
  }, [ensureLanguageSupport, currentLocale])

  return mapInitialValues
}
