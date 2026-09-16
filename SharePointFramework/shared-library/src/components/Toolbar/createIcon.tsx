import React from 'react'
import { ListMenuItem } from './types'
import { getFluentIconWithFallback } from '../../icons'

/**
 * Creates an icon component based on the provided list menu item. If the
 * `icon` property is a string, it is resolved through
 * `getFluentIconWithFallback` (icon catalog, legacy UI Fabric aliases, then a
 * UI Fabric font icon for unknown names; `null` for an empty string). If the
 * `icon` property is a component, it will be rendered as is.
 *
 * @param item - The list menu item to create the icon for.
 *
 * @returns The icon component.
 */
export function createIcon(item: ListMenuItem) {
  let IconElement = () => null
  if (typeof item.icon === 'string') {
    return getFluentIconWithFallback(item.icon)
  }
  if (item.icon) IconElement = item.icon as any
  return <IconElement />
}
