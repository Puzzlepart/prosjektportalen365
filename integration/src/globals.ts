import { JSDOM } from 'jsdom'
import { env } from './env.ts'

/**
 * What the library reads from a page where it expects a page: the browser's XML parser and
 * serializer, from jsdom (`transformFieldXml`), and the page context SharePoint sets on every page
 * (`_spPageContextInfo`), with the cultures of `INTEGRATION_LOCALE`, from which the library reads
 * the UI language and the regional format (`getUILocale`, `getRegionalLocale`). Nothing more: a
 * `window` or a `document` would make libraries take their browser paths. Without `localStorage`
 * and `sessionStorage`, PnPjs keeps its cache in memory. Imported for its side effect.
 */
const { window } = new JSDOM('')
const culture = env.locale.replace(/-(\w+)$/, (_, region: string) => `-${region.toUpperCase()}`)
Object.assign(globalThis, {
  DOMParser: window.DOMParser,
  XMLSerializer: window.XMLSerializer,
  _spPageContextInfo: { currentCultureName: culture, currentUICultureName: culture }
})
