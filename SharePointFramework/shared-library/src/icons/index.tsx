import { Icon } from '@fluentui/react'
import { bundleIcon } from '@fluentui/react-icons'
import React, { CSSProperties } from 'react'
import { iconCatalog } from './iconCatalog'
import { FluentIconName, GetFluentIconOptions } from './types'

/**
 * Returns the Fluent icon with the specified name.
 *
 * @param name - The name of the icon to retrieve.
 * @param options - The options to use when retrieving the icon.
 *
 * @returns The specified Fluent icon with the specified options, or null if the icon is not found
 * in the catalog.
 */
export function getFluentIcon<T = JSX.Element>(
  name: FluentIconName,
  options?: GetFluentIconOptions
): T {
  if (!iconCatalog[name]) return null
  const bundle = options?.bundle ?? true
  const color = options?.color
  const size = options?.size
  const filled = options?.filled ?? false
  const jsx = options?.jsx ?? true
  const icon = iconCatalog[name]
  const Icon = bundle ? bundleIcon(icon.filled, icon.regular) : icon.regular
  if (!jsx) return Icon as unknown as T
  const props: { style?: CSSProperties } = {}
  if (color) props.style = { color }
  if (size) {
    props.style = {
      ...props.style,
      width: size,
      height: size
    }
  }
  return (<Icon {...props} filled={filled} />) as unknown as T
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
 * Returns a Fluent UI icon component with fallback to a an icon from `@fluentui/react`.
 *
 * @param name - The name of the icon to retrieve.
 * @param bundleWithFilled - Whether to bundle the icon with the filled version. Defaults to true.
 * @param color - The color of the icon.
 *
 * @returns A Fluent UI icon component or a default icon component if the requested icon is not found.
 */
export function getFluentIconWithFallback(name: string, bundleWithFilled = true, color?: string) {
  if (iconCatalog[name]) {
    return getFluentIcon(name as FluentIconName, { bundle: bundleWithFilled, color })
  }
  return <Icon iconName={name} style={{ color }} />
}

/**
 * Checks if an icon with the given name is available in the icon catalog.
 *
 * @param name - The name of the icon to check.
 *
 * @returns True if the icon is available, false otherwise.
 */
export function isIconAvailable(name: string) {
  return !!iconCatalog[name]
}

export * from './types'
