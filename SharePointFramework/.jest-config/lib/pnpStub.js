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
 */
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
