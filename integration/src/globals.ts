import { JSDOM } from 'jsdom'

/**
 * The browser's XML parser and serializer, from jsdom, where the library expects them
 * (`transformFieldXml`). Nothing more of jsdom: a `window` or a `document` would make libraries
 * take their browser paths. Without `localStorage` and `sessionStorage`, PnPjs keeps its cache in
 * memory. Imported for its side effect.
 */
const { window } = new JSDOM('')
Object.assign(globalThis, { DOMParser: window.DOMParser, XMLSerializer: window.XMLSerializer })
