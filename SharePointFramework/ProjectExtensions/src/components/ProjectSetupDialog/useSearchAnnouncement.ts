import { useAnnounce } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { format } from 'pp365-shared-library'
import { useEffect, useRef } from 'react'

// Debounce announcements to avoid interrupting the user after every keystroke.
const SEARCH_ANNOUNCE_DELAY = 500

/** Announces search result counts after typing pauses, skipping the initial render. */
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
