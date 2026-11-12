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
  // A shrinkable item has no width of its own: one would hold it at its full width.
  if (item.width && !item.shrinkable) {
    style.width = item.width
    style.minWidth = item.width
  }
  return style
}
