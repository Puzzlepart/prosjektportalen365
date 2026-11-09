import { RefObject, useEffect, useRef } from 'react'
import { IDynamicListState } from './types'

/** Marks the element an opened item takes focus on: its heading, or its fields without one. */
export const NAVIGATION_FOCUS_ATTRIBUTE = 'data-navigation-focus'

/** Marks the link of an item or a folder in the list, by its id or its name. */
export const NAVIGATION_KEY_ATTRIBUTE = 'data-navigation-key'

/**
 * The link of the item or folder with the key given.
 *
 * @param root The web part's container
 * @param key The item's id or the folder's name
 */
function linkTo(root: HTMLElement, key?: string): HTMLElement | undefined {
  if (!key) return undefined
  return Array.from(root.querySelectorAll<HTMLElement>(`[${NAVIGATION_KEY_ATTRIBUTE}]`)).find(
    (link) => link.getAttribute(NAVIGATION_KEY_ATTRIBUTE) === key
  )
}

/**
 * Keeps the focus where the user is when the list moves to another view (WCAG 2.4.3). The link
 * that opened an item or a folder leaves the page as the view changes, which drops the focus to
 * the page's start. An opened item takes the focus on its heading, an opened folder on the
 * breadcrumb's current folder, and going back gives it to the link of the item or folder left.
 *
 * @param state The dynamic list's state
 * @param container The web part's container
 */
export function useNavigationFocus(state: IDynamicListState, container: RefObject<HTMLElement>) {
  const previous = useRef({
    isDrilledDown: !!state.isDrilledDown,
    folder: state.currentFolderPath ?? '',
    item: state.selectedItem
  })

  useEffect(() => {
    const before = previous.current
    const folder = state.currentFolderPath ?? ''
    previous.current = { isDrilledDown: !!state.isDrilledDown, folder, item: state.selectedItem }
    const root = container.current
    if (!root) return

    let target: HTMLElement | null | undefined
    if (state.isDrilledDown && !before.isDrilledDown) {
      target = root.querySelector<HTMLElement>(`[${NAVIGATION_FOCUS_ATTRIBUTE}]`)
    } else if (!state.isDrilledDown && before.isDrilledDown) {
      target = linkTo(root, before.item?.Id?.toString())
    } else if (folder !== before.folder) {
      const wentDown = before.folder ? folder.startsWith(`${before.folder}/`) : !!folder
      // Going up, the folder left is the first one below the folder now shown.
      target = wentDown
        ? root.querySelector<HTMLElement>('nav [aria-current="page"]')
        : linkTo(root, before.folder.slice(folder ? folder.length + 1 : 0).split('/')[0])
    }
    target?.focus()
  }, [state.isDrilledDown, state.currentFolderPath])
}
