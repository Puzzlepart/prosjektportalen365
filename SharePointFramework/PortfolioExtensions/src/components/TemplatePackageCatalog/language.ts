import strings from 'PortfolioExtensionsStrings'

/**
 * Normalize a BCP-47 language code to the coarse group the catalog filters and
 * badges share: `'nb'` for Norwegian (nb/nb-NO/nn/no), `'en'` for English,
 * otherwise the lower-cased code itself.
 */
export function languageGroup(code: string): string {
  switch (code.toLowerCase()) {
    case 'nb-no':
    case 'nb':
    case 'nn':
    case 'no':
      return 'nb'
    case 'en-us':
    case 'en-gb':
    case 'en':
      return 'en'
    default:
      return code.toLowerCase()
  }
}

/** Localized display name for a language code/group (falls back to the code). */
export function languageLabel(code: string): string {
  switch (languageGroup(code)) {
    case 'nb':
      return strings.CatalogLanguageNorwegian
    case 'en':
      return strings.CatalogLanguageEnglish
    default:
      return code
  }
}

/**
 * The language groups a package is available in. Packages without an explicit
 * `languages` list are treated as Norwegian-only.
 */
export function packageLanguageGroups(languages?: string[]): string[] {
  if (!languages || languages.length === 0) return ['nb']
  return Array.from(new Set(languages.map(languageGroup)))
}
