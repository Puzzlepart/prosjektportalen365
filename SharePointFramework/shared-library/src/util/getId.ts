// The counter lives on `window` rather than in this module, because several
// solutions can be on the same page (the footer application customizer and any
// web part), each with its own bundled copy of this library. A module-local
// counter would hand out `name0` twice in that case.
const CURRENT_ID_PROPERTY = '__pp365CurrentId__'

// Fluent UI v8's default, kept so ids look the same as before. Every call site
// in the repo passes its own prefix, so this is a fallback only.
const DEFAULT_ID_PREFIX = 'id__'

// Used when there is no window, such as under the Jest/Node test runner.
let fallbackId = 0

/**
 * Returns a process-unique id with the given prefix, for DOM ids, list column
 * keys and SPFx placeholder ids.
 *
 * This replaces `getId` from Fluent UI v8, which has no Fluent UI v9
 * equivalent: v9 offers only the `useId` hook, which cannot be called from the
 * module scope, a class field or a plain function, which is where the remaining
 * call sites are. Inside a component or hook, use `useId` from
 * `@fluentui/react-components` instead of this.
 *
 * @param prefix - Prefix for the id
 */
export function getId(prefix: string = DEFAULT_ID_PREFIX): string {
  const global: Record<string, number> = typeof window === 'undefined' ? undefined : (window as any)
  if (!global) {
    return `${prefix}${fallbackId++}`
  }
  if (typeof global[CURRENT_ID_PROPERTY] !== 'number') {
    global[CURRENT_ID_PROPERTY] = 0
  }
  return `${prefix}${global[CURRENT_ID_PROPERTY]++}`
}
