/**
 * The props with the component's defaults filled in where the caller gave none: a prop that is
 * `undefined` takes its default, `null`, `false`, `0` and `''` are kept as given. This is what
 * React did with `defaultProps`, which React 19 no longer honours on function components; the
 * merged object is what a hook, a context or a `{...props}` spread then sees.
 *
 * @param props The props as given
 * @param defaults The defaults, one per prop that has one
 */
export function withDefaults<T extends object>(props: T, defaults: Partial<T>): T {
  const merged = { ...props }
  for (const key of Object.keys(defaults) as (keyof T)[]) {
    if (merged[key] === undefined) merged[key] = defaults[key]
  }
  return merged
}
