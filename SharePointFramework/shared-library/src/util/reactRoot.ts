import { ReactElement } from 'react'
import { createRoot, Root } from 'react-dom/client'

/** The root of each container rendered into, from its first render until its unmount. */
const roots = new WeakMap<Element, Root>()

/**
 * Renders `element` into `container`, updating what an earlier call rendered there.
 *
 * Every web part, extension, dialog and property pane field mounts React through this function
 * and `unmountReact`. A container gets a React 18 root on its first render, which is kept for the
 * next render and dropped on the unmount: React renders into an unmounted root no more, and warns
 * when `createRoot` is called twice on one container. The render is scheduled, not done when the
 * call returns.
 *
 * @param element Element to render
 * @param container DOM element to render it into
 */
export function renderReact(element: ReactElement, container: Element): void {
  let root = roots.get(container)
  if (!root) {
    root = createRoot(container)
    roots.set(container, root)
  }
  root.render(element)
}

/**
 * Unmounts what `renderReact` rendered into `container`, running its clean-up; does nothing when
 * nothing is rendered there.
 *
 * @param container DOM element rendered into
 */
export function unmountReact(container: Element): void {
  const root = roots.get(container)
  if (!root) return
  roots.delete(container)
  root.unmount()
}
