import { Icon } from '@fluentui/react'
import { FluentIcon, bundleIcon } from '@fluentui/react-icons'
import React, { CSSProperties } from 'react'
import { fabricIconAliases } from './fabricIconAliases'
import { iconCatalog } from './iconCatalog'
import {
  FluentIconName,
  GetFluentIconOptions,
  GetFluentIconWithFallbackOptions,
  ResolvedFluentIcon
} from './types'

const bundledIcons = new Map<FluentIconName, FluentIcon>()
const fabricIcons = new Map<string, FluentIcon>()

/**
 * Own-property check for the plain object literals used as lookup tables, so
 * list values such as `constructor` or `toString` never resolve as a hit.
 *
 * @param obj - The lookup table.
 * @param key - The key to check.
 */
function has(obj: object, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

/**
 * Returns a cached bundled icon for the specified name. `bundleIcon` creates
 * a new component type on every call, which would make React remount the icon
 * (restarting any CSS animations) on each render.
 *
 * @param name - The name of the icon to retrieve.
 */
function getBundledIcon(name: FluentIconName) {
  if (!bundledIcons.has(name)) {
    const icon = iconCatalog[name]
    bundledIcons.set(name, bundleIcon(icon.filled, icon.regular))
  }
  return bundledIcons.get(name)
}

/**
 * Returns a cached component rendering a UI Fabric (MDL2) font icon with the
 * specified name, typed as a `FluentIcon` so it can be used wherever a
 * bundled Fluent icon component is expected. Cached so component identity is
 * stable across renders.
 *
 * @param name - The UI Fabric icon name.
 */
function getFabricIcon(name: string) {
  if (!fabricIcons.has(name)) {
    const FabricIcon: FluentIcon = (props) => <Icon iconName={name} className={props.className} />
    fabricIcons.set(name, FabricIcon)
  }
  return fabricIcons.get(name)
}

/**
 * Resolves an arbitrary icon name to a canonical icon catalog entry. The name
 * is looked up in the catalog first, then in `fabricIconAliases` (legacy UI
 * Fabric names). This is the single lookup all icon rendering sits on.
 *
 * @param name - The icon name to resolve (catalog key or UI Fabric alias).
 *
 * @returns The resolved icon, or `null` if the name is empty or unknown.
 */
export function resolveFluentIcon(name: string): ResolvedFluentIcon | null {
  if (!name) return null
  if (has(iconCatalog, name)) return { name: name as FluentIconName }
  if (!has(fabricIconAliases, name)) return null
  const alias = fabricIconAliases[name]
  if (typeof alias === 'string') return { name: alias }
  return { name: alias.name, filled: alias.filled }
}

/**
 * Returns the Fluent icon with the specified name.
 *
 * @param name - The name of the icon to retrieve.
 * @param options - The options to use when retrieving the icon. When `bundle`
 * is `false`, `filled` selects the filled or regular variant directly.
 *
 * @returns The specified Fluent icon with the specified options, or null if the icon is not found
 * in the catalog.
 */
export function getFluentIcon<T = JSX.Element>(
  name: FluentIconName,
  options?: GetFluentIconOptions
): T {
  if (!has(iconCatalog, name)) return null
  const bundle = options?.bundle ?? true
  const color = options?.color
  const size = options?.size
  const filled = options?.filled ?? false
  const jsx = options?.jsx ?? true
  const className = options?.className
  const icon = iconCatalog[name]
  const IconComponent = bundle ? getBundledIcon(name) : filled ? icon.filled : icon.regular
  if (!jsx) return IconComponent as unknown as T
  const props: { style?: CSSProperties; className?: string } = {}
  if (color) props.style = { color }
  if (size) {
    props.style = {
      ...props.style,
      width: size,
      height: size
    }
  }
  if (className) props.className = className
  return (<IconComponent {...props} filled={filled} />) as unknown as T
}

/**
 * Returns an array of strings representing the names of all available Fluent icons.
 *
 * @returns An array of strings representing the names of all available Fluent icons.
 */
export function getFluentIcons() {
  return Object.keys(iconCatalog).map((key) => ({
    name: key,
    hasFilledIcon: !!iconCatalog[key].filled
  }))
}

/**
 * Returns a Fluent UI icon element with fallback to a UI Fabric font icon from
 * `@fluentui/react`. The name is resolved through `resolveFluentIcon` (catalog
 * and legacy UI Fabric aliases). `size` maps to `width`/`height` on the Fluent
 * branch and `fontSize` on the UI Fabric branch, so callers do not need to
 * know which one rendered.
 *
 * @param name - The name of the icon to retrieve.
 * @param options - Rendering options.
 *
 * @returns A Fluent UI icon element, a UI Fabric icon element for unknown
 * names, or `null` for an empty name.
 */
export function getFluentIconWithFallback(
  name: string,
  options?: GetFluentIconWithFallbackOptions
): JSX.Element | null
/**
 * Returns a Fluent UI icon element with fallback to a UI Fabric font icon from
 * `@fluentui/react`.
 *
 * @deprecated Use the options object form instead:
 * `getFluentIconWithFallback(name, { bundle, color })`.
 *
 * @param name - The name of the icon to retrieve.
 * @param bundleWithFilled - Whether to bundle the icon with the filled version. Defaults to true.
 * @param color - The color of the icon.
 */
export function getFluentIconWithFallback(
  name: string,
  bundleWithFilled?: boolean,
  color?: string
): JSX.Element | null
export function getFluentIconWithFallback(
  name: string,
  options?: boolean | GetFluentIconWithFallbackOptions,
  color?: string
): JSX.Element | null {
  const opts: GetFluentIconWithFallbackOptions =
    typeof options === 'boolean' ? { bundle: options, color } : (options ?? {})
  if (!name) return null
  const resolved = resolveFluentIcon(name)
  if (resolved) {
    return getFluentIcon(resolved.name, {
      bundle: opts.bundle ?? true,
      filled: opts.filled ?? resolved.filled ?? false,
      color: opts.color,
      size: opts.size,
      className: opts.className
    })
  }
  return (
    <Icon
      iconName={name}
      className={opts.className}
      style={{ color: opts.color, fontSize: opts.size }}
    />
  )
}

/**
 * Returns an icon *component* (not an element) for the specified name, for
 * call sites that render the icon themselves (e.g. `Tab`/`MenuItem` `icon`
 * props). Catalog and alias names return the cached bundled Fluent icon;
 * unknown non-empty names return a cached UI Fabric wrapper; an empty name
 * returns the bundled `defaultName` icon. Component identity is stable across
 * calls so React never remounts the icon.
 *
 * @param name - The icon name (catalog key, UI Fabric alias or UI Fabric name).
 * @param defaultName - Catalog name to use when `name` is empty. Defaults to `Cube`.
 *
 * @returns A Fluent icon component.
 */
export function getIconComponentWithFallback(
  name: string,
  defaultName: FluentIconName = 'Cube'
): FluentIcon {
  if (!name) return getBundledIcon(defaultName)
  const resolved = resolveFluentIcon(name)
  if (resolved) return getBundledIcon(resolved.name)
  return getFabricIcon(name)
}

/**
 * Checks if an icon with the given name resolves to an entry in the icon
 * catalog, either directly or through a legacy UI Fabric alias.
 *
 * @param name - The name of the icon to check.
 *
 * @returns True if the icon is available, false otherwise.
 */
export function isIconAvailable(name: string) {
  return !!resolveFluentIcon(name)
}

export { fabricIconAliases } from './fabricIconAliases'
export * from './types'
