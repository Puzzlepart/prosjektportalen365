import React from 'react'
import { ListMenuItem } from './types'
import { Icon } from '@fluentui/react'
import { getFluentIcon, isIconAvailable } from '../../icons'

/**
 * Creates an icon component based on the provided list menu item. If the
 * `icon` property is a string, it will be used as the icon name. If the icon
 * name is not available in the icon catalog, it will be rendered as a Fluent
 * UI icon. If the `icon` property is a component, it will be rendered as is.
 *
 * @param item - The list menu item to create the icon for.
 *
 * @returns The icon component.
 */
export function createIcon(item: ListMenuItem) {
  let IconElement = () => null
  if (typeof item.icon === 'string') {
    if (isIconAvailable(item.icon)) {
      return getFluentIcon(item.icon as any)
    } else {
      return <Icon iconName={item.icon} />
    }
  }
  if (item.icon) IconElement = item.icon as any
  return <IconElement />
}
