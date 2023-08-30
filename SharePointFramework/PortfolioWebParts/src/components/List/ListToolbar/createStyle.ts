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
  switch (item.type) {
    /**
     * The `ListMenuItem` is a header and should be bold and 12px.
     */
    case 'header':
      {
        style.fontWeight = 'bold'
        style.fontSize = 12
      }
      break
    /**
     * The `ListMenuItem` is a divider and should have a border top and a height of 1px.
     */
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
