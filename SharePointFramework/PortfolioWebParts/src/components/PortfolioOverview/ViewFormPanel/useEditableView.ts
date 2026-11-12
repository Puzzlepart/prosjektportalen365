import { PortfolioOverviewView } from 'pp365-shared-library'
import { useEffect, useMemo, useState } from 'react'
import { usePortfolioOverviewContext } from '../context'

/**
 * Edit the selected form view or initialize a new view from the current view's defaults.
 */
export function useEditableView() {
  const context = usePortfolioOverviewContext()
  const [view, $setView] = useState<PortfolioOverviewView['$map']>(
    new PortfolioOverviewView().createDefault('', context?.state.currentView).$map
  )
  const isEditing = useMemo(() => !!context?.state.viewForm?.view, [context?.state.viewForm?.view])

  useEffect(() => {
    if (!context) return
    if (isEditing) {
      $setView(context.state.viewForm.view.$map)
    } else {
      $setView(new PortfolioOverviewView().createDefault('', context.state.currentView).$map)
    }
  }, [context?.state.viewForm, context?.state.currentView])

  /**
   * Sets a view property.
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
