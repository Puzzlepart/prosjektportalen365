import React from 'react'
import { IListMenuItem } from '../types'
import { Icon } from '@fluentui/react'

/**
 * Creates an icon component based on the provided list menu item.
 *
 * @param item - The list menu item to create the icon for.
 *
 * @returns The icon component.
 */
export function createIcon(item: IListMenuItem) {
  let IconElement = () => null
  if (typeof item.icon === 'string') {
    return <Icon iconName={item.icon} />
  }
  if (item.icon) IconElement = item.icon as any
  return <IconElement />
}
