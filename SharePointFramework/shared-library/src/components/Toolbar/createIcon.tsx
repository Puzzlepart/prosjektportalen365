import React from 'react'
import { ListMenuItem } from './types'
import { Icon } from '@fluentui/react'

/**
 * Creates an icon component based on the provided list menu item.
 *
 * @param item - The list menu item to create the icon for.
 *
 * @returns The icon component.
 */
export function createIcon(item: ListMenuItem) {
  let IconElement = () => null
  if (typeof item.icon === 'string') {
    return <Icon iconName={item.icon} />
  }
  if (item.icon) IconElement = item.icon as any
  return <IconElement />
}
