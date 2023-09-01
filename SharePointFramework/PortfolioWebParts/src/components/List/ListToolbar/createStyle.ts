import { CSSProperties } from 'react'
import { ListMenuItem } from './types'

/**
 * Creates a `CSSProperties` object based on the provided `IListMenuItem`.
 *
 * @param item - The `IListMenuItem` to create the `CSSProperties` object from.
 * @param additionalStyle - Additional styles to apply to the `CSSProperties` object.
 *
 * @returns A `CSSProperties` object.
 */
export function createStyle(item: ListMenuItem, additionalStyle?: CSSProperties) {
  const style: CSSProperties = {
    ...(item.style ?? {}),
    ...additionalStyle
  }
  if (item.width) {
    style.width = item.width
    style.minWidth = item.width
  }
  return style
}
