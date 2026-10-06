import { ReactElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

/**
 * Renders `element` into `container`, updating what an earlier call rendered there.
 *
 * Every web part, extension, dialog and property pane field mounts React through this function
 * and `unmountReact`, so that the move to React 18's `createRoot` changes only this file: there a
 * root is created for a container on its first render and kept for the next render and the unmount.
 *
 * @param element Element to render
 * @param container DOM element to render it into
 */
export function renderReact(element: ReactElement, container: Element): void {
  render(element, container)
}

/**
 * Unmounts what `renderReact` rendered into `container`, running its clean-up; does nothing when
 * nothing is rendered there.
 *
 * @param container DOM element rendered into
 */
export function unmountReact(container: Element): void {
  unmountComponentAtNode(container)
}
