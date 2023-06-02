/**
 * Inject styles
 *
 * @param css CSS
 *
 * @returns {HTMLStyleElement} The style element
 */
export function injectStyles(css: string): HTMLStyleElement {
  const head = document.head || document.getElementsByTagName('head')[0]
  const style = document.createElement('style')
  head.appendChild(style)
  style.type = 'text/css'
  if (style['styleSheet']) {
    style['styleSheet'].cssText = css
  } else {
    style.appendChild(document.createTextNode(css))
  }
  return style
}
