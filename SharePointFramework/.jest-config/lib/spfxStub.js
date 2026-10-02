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
      // Jest takes any value whose `asymmetricMatch` is a function for a matcher of its own.
      if (prop === 'asymmetricMatch') return undefined
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

// @microsoft/sp-core-library: SPFx's Version, `MAJOR.MINOR[.PATCH[.REVISION]]`; missing parts
// compare as zero, and `parse` throws where `tryParse` returns undefined.
class Version {
  constructor(major, minor, patch, revision) {
    this.major = major
    this.minor = minor
    this.patch = patch
    this.revision = revision
  }
  static tryParse(value) {
    const match = /^([0-9]+)\.([0-9]+)(?:\.([0-9]+)(?:\.([0-9]+))?)?$/.exec(value || '')
    if (!match) return undefined
    const part = (index) => (match[index] === undefined ? undefined : parseInt(match[index], 10))
    return new Version(part(1), part(2), part(3), part(4))
  }
  static parse(value) {
    const version = Version.tryParse(value)
    if (!version) throw new Error(`Invalid version string: ${value}`)
    return version
  }
  static isValid(value) {
    return Version.tryParse(value) !== undefined
  }
  static compare(a, b) {
    for (const key of ['major', 'minor', 'patch', 'revision']) {
      const left = a[key] || 0
      const right = b[key] || 0
      if (left !== right) return left > right ? 1 : -1
    }
    return 0
  }
  lessThan(other) {
    return Version.compare(this, other) < 0
  }
  greaterThan(other) {
    return Version.compare(this, other) > 0
  }
  equals(other) {
    return Version.compare(this, other) === 0
  }
  satisfies(other) {
    return this.major === other.major && !this.lessThan(other)
  }
  toString() {
    let value = `${this.major}.${this.minor}`
    if (this.patch !== undefined) {
      value += `.${this.patch}`
      if (this.revision !== undefined) value += `.${this.revision}`
    }
    return value
  }
}

// The SPFx base classes. Product classes extend them, and extending the chainable proxy gives an
// instance that is itself a proxy, without the subclass's methods. They are ES5 constructor
// functions, as SPFx's own are: the solutions compile to ES5, and an ES5 subclass cannot call a
// native `class` constructor. SPFx sets `context`, `properties` and (web parts) `domElement`
// before `onInit`; a test assigns them on the instance.
const resolved = () => Promise.resolve()

// @microsoft/sp-application-base
function BaseApplicationCustomizer() {
  this.properties = {}
}
BaseApplicationCustomizer.prototype.onInit = resolved

// @microsoft/sp-listview-extensibility. SPFx builds the commands from the manifest; here every id
// gets one on first request, visible until the command set says otherwise.
function BaseListViewCommandSet() {
  this.properties = {}
  this._commands = new Map()
}
BaseListViewCommandSet.prototype.onInit = resolved
BaseListViewCommandSet.prototype.tryGetCommand = function (id) {
  if (!this._commands.has(id)) this._commands.set(id, { id, title: '', visible: true })
  return this._commands.get(id)
}
BaseListViewCommandSet.prototype.raiseOnChange = noop

function BaseFieldCustomizer() {
  this.properties = {}
}
BaseFieldCustomizer.prototype.onInit = resolved
BaseFieldCustomizer.prototype.onRenderCell = noop
BaseFieldCustomizer.prototype.onDisposeCell = noop

// @microsoft/sp-webpart-base
function BaseClientSideWebPart() {
  this.properties = {}
  this.displayMode = 1
}
BaseClientSideWebPart.prototype.onInit = resolved
BaseClientSideWebPart.prototype.onDispose = noop
BaseClientSideWebPart.prototype.getPropertyPaneConfiguration = () => ({ pages: [] })

// @microsoft/sp-dialog. As in SPFx, `close` and `render` are bound to the dialog, `show` renders
// after the current task into a new element and resolves when the dialog has closed, and
// `onAfterClose` runs once it has.
function BaseDialog(config) {
  this._config = config || {}
  this._isOpen = false
  this.close = this.close.bind(this)
  if (this.render) this.render = this.render.bind(this)
}
Object.defineProperty(BaseDialog.prototype, 'domElement', {
  get() {
    return this._domElement
  }
})
Object.defineProperty(BaseDialog.prototype, 'isOpen', {
  get() {
    return this._isOpen
  }
})
BaseDialog.prototype.show = function () {
  return new Promise((resolve) => {
    this._resolveShow = resolve
    Promise.resolve()
      .then(() => this.onBeforeOpen())
      .then(() => {
        this._domElement = document.body.appendChild(document.createElement('div'))
        this._isOpen = true
        this.render()
      })
  })
}
BaseDialog.prototype.close = function () {
  if (!this._isOpen) return Promise.resolve()
  this._isOpen = false
  return Promise.resolve().then(() => {
    this.onAfterClose()
    this._domElement.remove()
    this._resolveShow()
  })
}
BaseDialog.prototype.getConfig = () => ({})
BaseDialog.prototype.onBeforeOpen = resolved
BaseDialog.prototype.onAfterClose = noop

// @microsoft/sp-dialog's static dialogs; SPFx resolves them when the user closes them, here at once.
const Dialog = {
  alert: () => Promise.resolve(),
  prompt: () => Promise.resolve(undefined)
}

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
  Version,
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
  // The field factories return what SPFx's do, a field of a type for a target property, so a
  // test can read a web part's property pane.
  PropertyPaneTextField: (targetProperty, properties) => ({ type: 3, targetProperty, properties }),
  PropertyPaneToggle: (targetProperty, properties) => ({ type: 5, targetProperty, properties }),
  PropertyPaneDropdown: (targetProperty, properties) => ({ type: 6, targetProperty, properties }),
  // @microsoft/sp-application-base
  PlaceholderName: { Top: 0, Bottom: 1 },
  BaseApplicationCustomizer,
  // @microsoft/sp-listview-extensibility
  BaseListViewCommandSet,
  BaseFieldCustomizer,
  // @microsoft/sp-webpart-base
  BaseClientSideWebPart,
  // @microsoft/sp-dialog
  BaseDialog,
  Dialog
}

module.exports = createStub('@microsoft/sp')
