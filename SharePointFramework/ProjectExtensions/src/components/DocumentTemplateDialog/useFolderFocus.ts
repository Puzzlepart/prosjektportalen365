import { RefObject, useEffect, useRef } from 'react'

/** Marks a folder's link in a list of folders with the folder's server relative URL. */
export const FOLDER_URL_ATTRIBUTE = 'data-folder-url'

/** How often, and how many times, the link of the folder left is looked for as the list fills. */
const RETRY_DELAY = 100
const RETRIES = 100

/**
 * Keeps the focus where the user is as a screen moves between folders (WCAG 2.4.3): the link
 * that opened a folder leaves the page with the list, which drops the focus to the page's start.
 * A folder opened gives the focus to the trail's current folder; going up gives it to the link of
 * the folder left, once the list shows it: the list draws its rows after the screen, and the
 * target screen reads its folders from SharePoint. The focus is not taken from wherever the user
 * has moved it meanwhile.
 *
 * @param folder The open folder's server relative URL, or an empty string for the root
 * @param container The screen's element
 */
export function useFolderFocus(folder: string, container: RefObject<HTMLElement>): void {
  const previous = useRef(folder)

  useEffect(() => {
    const before = previous.current
    previous.current = folder
    const root = container.current
    if (before === folder || !root) return
    const wentUp = folder ? before.startsWith(`${folder}/`) : !!before
    if (!wentUp) {
      root.querySelector<HTMLElement>('nav [aria-current="page"]')?.focus()
      return
    }
    // The focus is where the move left it: on the page's start, or on the trail's step clicked.
    const isUnmoved = () =>
      document.activeElement === document.body ||
      !!root.querySelector('nav')?.contains(document.activeElement)
    let tries = 0
    let timer: ReturnType<typeof setTimeout>
    const focusLink = () => {
      const link = Array.from(root.querySelectorAll<HTMLElement>(`[${FOLDER_URL_ATTRIBUTE}]`)).find(
        (element) => {
          const url = element.getAttribute(FOLDER_URL_ATTRIBUTE)
          return before === url || before.startsWith(`${url}/`)
        }
      )
      if (link) {
        if (isUnmoved()) link.focus()
      } else if (tries++ < RETRIES) {
        timer = setTimeout(focusLink, RETRY_DELAY)
      }
    }
    focusLink()
    return () => clearTimeout(timer)
  }, [folder])
}
