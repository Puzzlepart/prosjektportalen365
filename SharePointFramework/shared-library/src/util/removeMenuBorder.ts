/**
 * Removes each menu item's inline border in place and returns the mapped array.
 */
export function removeMenuBorder<P = any>(items: P[]): P[] {
  return items.map((item) => {
    item['style'] = item['style'] || {}
    item['style'].border = 'none'
    return item
  })
}
