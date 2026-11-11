/**
 * Stand-in for every `@pnp/*` module inside Jest.
 *
 * PnPjs 4 is ESM-only and Heft runs Jest on CommonJS output, so a real `require('@pnp/sp')`
 * throws before any test runs. Components under test never talk to SharePoint directly (they go
 * through a data adapter that the test mocks with `jest.mock`), but many of them import a module
 * that imports `@pnp/sp` at the top. This stub lets those imports succeed: every property access
 * and every call returns another stub, so module-level wiring such as `spfi().using(...)` does
 * not explode, while an awaited result surfaces as an explicit error instead of a silent
 * `undefined`. If a test hits that error, mock the adapter or service the component uses.
 *
 * `@pnp/core` also exports pure helpers (`stringIsNullOrEmpty`, `dateAdd`, ...) that components
 * call on their own data, with no SharePoint behind them. Those come back as the real thing from
 * KNOWN below, so a branch such as "render the display field when there is one" behaves as in the
 * browser instead of always taking the proxy's truthy answer.
 */
const { randomUUID } = require('crypto')

const hasOwn = (object, prop) => Object.prototype.hasOwnProperty.call(object, prop)

const stringIsNullOrEmpty = (value) => typeof value === 'undefined' || value === null || value.length < 1

/** In-memory stand-in for PnPClientStore (get/put/delete/getOrPut), no expiry. */
class PnPClientStore {
  constructor() {
    this._store = new Map()
    this.enabled = true
  }
  get(key) {
    return this._store.has(key) ? this._store.get(key) : null
  }
  put(key, value) {
    this._store.set(key, value)
  }
  delete(key) {
    this._store.delete(key)
  }
  async getOrPut(key, getter) {
    if (!this._store.has(key)) this._store.set(key, await getter())
    return this._store.get(key)
  }
  deleteExpired() {}
}

const KNOWN = {
  // @pnp/logging
  LogLevel: { Verbose: 0, Info: 1, Warning: 2, Error: 3, Off: 99 },
  stringIsNullOrEmpty,
  isArray: (value) => Array.isArray(value),
  isFunc: (value) => typeof value === 'function',
  objectDefinedNotNull: (value) => typeof value !== 'undefined' && value !== null,
  hOP: (object, prop) => hasOwn(object, prop),
  isUrlAbsolute: (url) => /^https?:\/\/|^\/\//i.test(String(url)),
  combine: (...paths) =>
    paths
      .filter((path) => !stringIsNullOrEmpty(path))
      .map((path) => String(path).replace(/^[\\|/]/, '').replace(/[\\|/]$/, ''))
      .join('/')
      .replace(/\\/g, '/'),
  dateAdd: (date, interval, units) => {
    const result = new Date(date)
    const checkRollover = () => {
      if (result.getDate() !== date.getDate()) result.setDate(0)
    }
    switch (String(interval).toLowerCase()) {
      case 'year':
        result.setFullYear(result.getFullYear() + units)
        checkRollover()
        break
      case 'quarter':
        result.setMonth(result.getMonth() + 3 * units)
        checkRollover()
        break
      case 'month':
        result.setMonth(result.getMonth() + units)
        checkRollover()
        break
      case 'week':
        result.setDate(result.getDate() + 7 * units)
        break
      case 'day':
        result.setDate(result.getDate() + units)
        break
      case 'hour':
        result.setTime(result.getTime() + units * 3600000)
        break
      case 'minute':
        result.setTime(result.getTime() + units * 60000)
        break
      case 'second':
        result.setTime(result.getTime() + units * 1000)
        break
      default:
        return undefined
    }
    return result
  },
  getGUID: () => randomUUID(),
  getHashCode: (value) => {
    let hash = 0
    const text = String(value)
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i)
      hash |= 0
    }
    return hash
  },
  PnPClientStorage: class PnPClientStorage {
    constructor() {
      this.local = new PnPClientStore()
      this.session = new PnPClientStore()
    }
  }
}

function createStub(path) {
  const target = function () {}
  return new Proxy(target, {
    get(_, prop) {
      if (prop === Symbol.toPrimitive) return () => `[pnp stub ${path}]`
      if (prop === 'then') {
        return (_resolve, reject) => {
          const error = new Error(
            `PnPjs is not available in unit tests (awaited ${path}). Mock the data adapter or service the component uses.`
          )
          return reject ? reject(error) : Promise.reject(error)
        }
      }
      if (prop === '__esModule') return true
      // Jest takes any value whose `asymmetricMatch` is a function for a matcher of its own, so
      // a stub value would fail `expect.anything()` and every equality it is part of.
      if (prop === 'asymmetricMatch') return undefined
      if (path === '@pnp' && hasOwn(KNOWN, prop)) return KNOWN[prop]
      if (prop === 'default') return createStub(path)
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

module.exports = createStub('@pnp')
