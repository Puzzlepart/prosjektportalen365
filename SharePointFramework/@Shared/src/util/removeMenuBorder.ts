/**
 * Remove border from contextual menu items
 *
 * @param {P[]} items Menu items
 */
export function removeMenuBorder<P = any>(items: P[]): P[] {
  return items.map((item) => {
    item['style'] = item['style'] || {}
    item['style'].border = 'none'
    return item
  })
}
