import { RefObject, useEffect, useRef } from 'react'

/** Marks a folder's link in a list of folders with the folder's server relative URL. */
export const FOLDER_URL_ATTRIBUTE = 'data-folder-url'

// Rows arrive asynchronously, so focus restoration retries for a bounded interval.
const RETRY_DELAY = 100
const RETRIES = 100

/**
 * Restores focus after folder navigation without overriding a subsequent user focus change.
 *
 * @param folder The open folder's server relative URL, or an empty string for the root
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
    // Do not steal focus if the user has moved from the breadcrumb to another control.
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
