import { useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'

/**
 * Hook that provides an editable view object and a function to update it.
 *
 * @returns An object containing the view, a function to update the view, and a boolean indicating whether the view is being edited.
 */
export function useEditableView() {
  const context = useContext(PortfolioAggregationContext)
  const [view, $setView] = useState(new Map<string, any>())
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
          ['iconName', 'ViewList'],
          ['searchQuery', context.state.currentView?.searchQuery]
        ])
      )
    }
  }, [context.state.viewForm, context.state.currentView])

  /**
   * Sets a view property.
   *
   * @param key Key of the view property to set
   * @param value Value of the view property to set
   */
  const setView = (key: string, value: any) => {
    $setView((prev) => {
      const newView = new Map(prev)
      newView.set(key, value)
      return newView
    })
  }

  return { view, setView, isEditing } as const
}
