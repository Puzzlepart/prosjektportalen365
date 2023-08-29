import { CSSProperties } from 'react'
import { IListMenuItem } from '../types'

/**
 * Creates a `CSSProperties` object based on the provided `IListMenuItem`.
 *
 * @param item - The `IListMenuItem` to create the `CSSProperties` object from.
 *
 * @returns A `CSSProperties` object.
 */
export function createStyle(item: IListMenuItem) {
  const style: CSSProperties = {
    ...(item.style ?? {})
  }
  if (item.width) {
    style.width = item.width
    style.minWidth = item.width
  }
  switch (item.type) {
    case 'header':
      {
        style.fontWeight = 'bold'
      }
      break
    case 'divider':
      {
        style.borderTop = '1px solid #eaeaea'
        style.height = '1px'
        style.minHeight = '1px'
      }
      break
  }
  return style
}
