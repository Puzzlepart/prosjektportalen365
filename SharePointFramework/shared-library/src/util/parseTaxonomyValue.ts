import { stringIsNullOrEmpty } from '@pnp/core'

/**
 * `true` when `fieldName` is a SharePoint search managed property for a
 * taxonomy field — matches both auto-generated `owstaxId<Field>` (prefix) and
 * manually aliased `<Field>OWSTAXID` (suffix) forms.
 */
export function isTaxonomyManagedProperty(fieldName: string): boolean {
  if (stringIsNullOrEmpty(fieldName)) return false
  return fieldName.toLowerCase().indexOf('owstaxid') !== -1
}

// `L0|#<lcid><termGuid>|<label>` — the label is the LAST `|`-piece, not the first.
function extractLabelFromL0(token: string): string {
  const inner = token.replace(/^L0\|#/, '')
  const parts = inner.split('|')
  return (parts.length > 1 ? parts[parts.length - 1] : inner).trim()
}

/**
 * Convert a taxonomy field value coming from SharePoint search / list REST
 * into a clean `;`-separated list of term labels.
 *
 * Examples:
 * - `'GP0|#…;L0|#0…|DVD;GTSet|#…'` → `'DVD'`
 * - `'1;#Foo|guid1;#2;#Bar|guid2'` → `'Foo;Bar'`
 * - `['1;#Foo|guid1', '2;#Bar|guid2']` → `'Foo;Bar'`
 * - `'Foo'` / `''` / `null` → unchanged
 */
export function parseTaxonomyValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  if (Array.isArray(value)) {
    return value
      .map((v) => parseTaxonomyValue(v))
      .filter((s) => !stringIsNullOrEmpty(s))
      .join(';')
  }

  const str = String(value)
  if (stringIsNullOrEmpty(str)) return ''

  if (str.indexOf('L0|#') !== -1) {
    const matches = str.match(/L0\|#([^;]+)/g) ?? []
    const labels = matches.map(extractLabelFromL0).filter(Boolean)
    if (labels.length > 0) return labels.join(';')
  }

  if (str.indexOf(';#') !== -1) {
    // Alternating `<wssid>;#<label>|<guid>` — labels live at odd indices.
    const parts = str.split(';#')
    const labels: string[] = []
    for (let i = 1; i < parts.length; i += 2) {
      const label = parts[i].split('|')[0].trim()
      if (label) labels.push(label)
    }
    if (labels.length > 0) return labels.join(';')
    const tail = str.split(';#').pop() ?? ''
    return tail.indexOf('|') !== -1 ? tail.split('|')[0].trim() : tail.trim()
  }

  // Strip a stray `|<guid>` suffix; guarded so plain values like `Foo|Bar` pass through.
  if (str.indexOf('|') !== -1 && /\|[0-9a-f-]{8,}/i.test(str)) {
    return str.split('|')[0].trim()
  }
  return str
}
