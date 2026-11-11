/**
 * Jest transform that turns an SPFx localized string bundle into a CommonJS module.
 *
 * The bundles are hand written AMD modules of the exact shape
 *   define([], function () { return { Key: 'value', ... } })
 * and are copied verbatim into lib-commonjs. Node has no `define`, so requiring one throws.
 * Rather than evaluating arbitrary AMD, this transform provides a `define` that accepts exactly
 * that shape and records the returned object; anything else fails loudly with the file name, so
 * a malformed bundle (for example a stray `,,`, which also crashes the module in the browser) is
 * reported by the test run instead of surfacing at runtime.
 */
const crypto = require('crypto')

module.exports = {
  process(sourceText, sourcePath) {
    const code = [
      'var __pp365Exports;',
      'function define(deps, factory) {',
      '  if (typeof factory !== "function") throw new Error("Unexpected AMD shape in ' + sourcePath.replace(/\\/g, '/') + '");',
      '  __pp365Exports = factory();',
      '}',
      sourceText,
      // No `__esModule` flag on purpose: TypeScript's __importDefault then wraps the object as
      // the default export, which is exactly how `import strings from \'...Strings\'` is consumed.
      'module.exports = __pp365Exports;'
    ].join('\n')
    return { code }
  },
  getCacheKey(sourceText, sourcePath) {
    // Hash this transformer's own source too, so editing it invalidates Jest's transform cache.
    return crypto
      .createHash('sha1')
      .update(sourceText)
      .update(sourcePath)
      .update(require('fs').readFileSync(__filename))
      .digest('hex')
  }
}
