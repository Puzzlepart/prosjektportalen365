import { useId } from '@fluentui/react-components'
import { useState } from 'react'
import { IRecentNewsProps } from './types'

/**
 * Component logic hook for `RecentNews`: the news shown, the first few or all of them, and the id
 * of their list, which the button that shows more names as what it opens (WCAG 4.1.2).
 *
 * @param props Props for the component
 */
export function useRecentNews({ news, maxVisible = 4 }: IRecentNewsProps) {
  const [showAll, setShowAll] = useState(false)
  const listId = useId('recent-news')

  return {
    showAll,
    toggleShowAll: () => setShowAll(!showAll),
    visibleNews: showAll ? news : news.slice(0, maxVisible),
    hasMore: news.length > maxVisible,
    listId
  } as const
}
