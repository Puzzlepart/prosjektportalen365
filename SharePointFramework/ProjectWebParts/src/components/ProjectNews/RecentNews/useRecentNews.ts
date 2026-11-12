import { useId } from '@fluentui/react-components'
import { useState } from 'react'
import { IRecentNewsProps } from './types'

/**
 * Selects initially visible or all news and supplies the expandable list's accessible target.
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
