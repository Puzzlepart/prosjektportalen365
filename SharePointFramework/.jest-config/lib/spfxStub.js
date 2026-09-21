/**
 * Stand-in for `@microsoft/sp-*` packages inside Jest.
 *
 * SPFx runtime packages are externals at runtime (the SharePoint page provides them) and their
 * `lib-commonjs` builds require Microsoft-internal modules (`@msinternal/ecs-flight`, ...) that
 * are not installable, so they cannot be loaded in Node. Components rarely depend on their
 * behaviour, but they import them freely, so this stub keeps the imports working.
 *
 * A handful of members that product code uses as VALUES (enums, small utilities) get real
 * implementations below, because a Proxy is useless in a `switch` or a comparison. Everything else
 * is a chainable Proxy, like lib/pnpStub.js. Add to KNOWN when a test needs real behaviour, and
 * keep each entry as small as the code under test requires.
 */
const { randomUUID } = require('crypto')

function createStub(path) {
  const target = function () {}
  return new Proxy(target, {
    get(_, prop) {
      if (prop === Symbol.toPrimitive) return () => `[spfx stub ${path}]`
      if (prop === '__esModule') return true
      if (prop === 'then') return undefined
      if (prop in KNOWN) return KNOWN[prop]
      return createStub(`${path}.${String(prop)}`)
    },
    apply() {
      return createStub(`${path}()`)
    },
    construct() {
      return createStub(`new ${path}`)
    }
  })
}

class UrlQueryParameterCollection {
  constructor(url) {
    this._params = new URL(url, 'https://localhost/').searchParams
  }
  getValue(name) {
    const value = this._params.get(name)
    return value === null ? undefined : value
  }
  getValues(name) {
    return this._params.getAll(name)
  }
}

const noop = () => undefined

const KNOWN = {
  // @microsoft/sp-core-library
  DisplayMode: { Read: 1, Edit: 2 },
  Environment: { type: 3 },
  EnvironmentType: { Test: 1, Local: 2, SharePoint: 3, ClassicSharePoint: 4 },
  Guid: {
    newGuid: () => ({ toString: () => randomUUID() }),
    isValid: (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value)),
    empty: { toString: () => '00000000-0000-0000-0000-000000000000' },
    parse: (value) => ({ toString: () => String(value) })
  },
  Log: { info: noop, warn: noop, error: noop, verbose: noop },
  Version: { parse: (value) => ({ toString: () => String(value), major: Number(String(value).split('.')[0]) }) },
  Text: {
    format: (template, ...args) => String(template).replace(/\{(\d+)\}/g, (_, i) => String(args[i] ?? '')),
    replaceAll: (input, search, replacement) => String(input).split(search).join(replacement)
  },
  UrlQueryParameterCollection,
  // @microsoft/sp-http
  SPHttpClient: Object.assign(class SPHttpClient {}, { configurations: { v1: {} } }),
  HttpClient: Object.assign(class HttpClient {}, { configurations: { v1: {} } }),
  // @microsoft/sp-property-pane
  PropertyPaneFieldType: { Custom: 1, CheckBox: 2, TextField: 3, Toggle: 5, Dropdown: 6, Label: 7, Slider: 8, Heading: 9, ChoiceGroup: 10, Button: 11, HorizontalRule: 12, Link: 13, DynamicField: 14, DynamicFieldSet: 15, ThumbnailPicker: 16, IconPicker: 17 },
  // @microsoft/sp-application-base
  PlaceholderName: { Top: 0, Bottom: 1 }
}

module.exports = createStub('@microsoft/sp')
