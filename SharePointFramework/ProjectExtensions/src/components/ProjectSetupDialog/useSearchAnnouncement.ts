import { useAnnounce } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { useEffect, useRef } from 'react'

/**
 * How long a search waits after the last keystroke before it tells how many items it shows, so a
 * screen reader is not told the count after every letter.
 */
const SEARCH_ANNOUNCE_DELAY = 500

/**
 * Tells how many of a section's items a search leaves shown (WCAG 4.1.3), once the user stops
 * typing; not when the section first shows.
 *
 * @param searchTerm What is searched for
 * @param shown The number of items shown
 * @param total The number of items the section has
 */
export function useSearchAnnouncement(searchTerm: string, shown: number, total: number): void {
  const { announce } = useAnnounce()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const timer = setTimeout(
      () => announce(format(strings.SearchResultsCount, shown, total), { polite: true }),
      SEARCH_ANNOUNCE_DELAY
    )
    return () => clearTimeout(timer)
  }, [searchTerm])
}
