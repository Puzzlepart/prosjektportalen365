import { useEffect, useState } from 'react'
import { usePortfolioAggregationContext } from '../context'

/**
 * Hook that provides an editable view object and a function to update it.
 *
 * @returns An object containing the view, a function to update the view, and a boolean indicating whether the view is being edited.
 */
export function useEditableView() {
  const context = usePortfolioAggregationContext()
  const [view, $setView] = useState(
    new Map([
      ['title', ''],
      ['searchQuery', ''],
      ['iconName', 'ViewList']
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
          ['iconName', 'ViewList']
        ])
      )
    }
  }, [context.state.viewForm, context.state.currentView])

  /**
   * Sets a view property in the `view` state variable.
   *
   * @param key Key of the view property to set
   * @param value Value of the view property to set
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
