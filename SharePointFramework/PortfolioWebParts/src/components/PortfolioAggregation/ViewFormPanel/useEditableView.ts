import { useEffect, useState } from 'react'
import { usePortfolioAggregationContext } from '../context'

/**
 * Edit an existing data-source view or initialize a new one with the current query.
 */
export function useEditableView() {
  const context = usePortfolioAggregationContext()
  const [view, $setView] = useState(
    new Map([
      ['title', ''],
      ['searchQuery', ''],
      ['iconName', 'AppsList']
    ])
  )
  const isEditing = !!context.state.viewForm.view

  useEffect(() => {
    if (isEditing) {
      $setView(
        new Map([
          ['title', context.state.viewForm.view.title],
          ['searchQuery', context.state.viewForm.view.searchQuery],
          ['iconName', context.state.viewForm.view.iconName]
        ])
      )
    } else {
      $setView(
        new Map([
          ['title', ''],
          ['searchQuery', context.state.currentView?.searchQuery ?? ''],
          ['iconName', 'AppsList']
        ])
      )
    }
  }, [context.state.viewForm, context.state.currentView])

  /**
   * Sets a view property in the `view` state variable.
   */
  const setView = (key: 'title' | 'iconName' | 'searchQuery', value: any) => {
    $setView((prev) => {
      const newView = new Map(prev)
      newView.set(key, value)
      return newView
    })
  }

  return { view, setView, isEditing } as const
}
