import { useAnnounce } from '@fluentui/react-components'
import { format } from 'pp365-shared-library'
import * as strings from 'ProjectWebPartsStrings'
import { useContext, useEffect, useRef } from 'react'
import { DynamicListContext } from './context'

/**
 * How long a search waits after the last keystroke before it tells how many items it shows, so a
 * screen reader is not told the count after every letter.
 */
const SEARCH_ANNOUNCE_DELAY = 500

/**
 * Tells how many of the items a search or a filter leaves shown (WCAG 4.1.3), once the user
 * stops typing; not when the list first shows.
 *
 * @param shown The number of items shown
 * @param total The number of items before the search and the filters
 */
export function useResultsAnnouncement(shown: number, total: number): void {
  const context = useContext(DynamicListContext)
  const { announce } = useAnnounce()
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    const timer = setTimeout(
      () => announce(format(strings.DynamicList.ItemsShown, shown, total), { polite: true }),
      SEARCH_ANNOUNCE_DELAY
    )
    return () => clearTimeout(timer)
  }, [context.state.searchTerm, context.state.activeFilters])
}

/**
 * Tells when the list has been fetched again from the refresh button (WCAG 4.1.3): the spinner
 * that shows meanwhile says nothing to a screen reader.
 *
 * @param isRefetching Whether the list is being fetched again
 */
export function useRefreshAnnouncement(isRefetching: boolean): void {
  const { announce } = useAnnounce()
  const wasRefetching = useRef(isRefetching)

  useEffect(() => {
    if (wasRefetching.current && !isRefetching) {
      announce(strings.DynamicList.RefreshDone, { polite: true })
    }
    wasRefetching.current = isRefetching
  }, [isRefetching])
}
