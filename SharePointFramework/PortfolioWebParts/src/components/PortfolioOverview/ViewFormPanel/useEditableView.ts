import { PortfolioOverviewView } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioOverviewContext } from '../context'

/**
 * Hook that provides an editable view object and a function to update it.
 * The view object is derived from the current view in the context.
 * If the user is editing a view, the view object is set to the current view.
 * If the user is not editing a view, the view object is set to a default view object.
 *
 * @returns An object containing the view object, a function to update the view object, and a boolean indicating whether the user is editing a view.
 */
export function useEditableView() {
  const context = useContext(PortfolioOverviewContext)
  const [view, $setView] = useState<PortfolioOverviewView['$map']>(
    new PortfolioOverviewView().createDefault('', context.state.currentView).$map
  )
  const isEditing = !!context.state.viewForm.view

  useEffect(() => {
    if (isEditing) {
      $setView(context.state.viewForm.view.$map)
    } else {
      $setView(new PortfolioOverviewView().createDefault('', context.state.currentView).$map)
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
