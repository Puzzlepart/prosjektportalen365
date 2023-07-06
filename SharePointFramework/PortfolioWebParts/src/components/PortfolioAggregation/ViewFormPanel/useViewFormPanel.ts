import { SPDataSourceItem } from 'pp365-shared-library'
import { useContext, useEffect, useState } from 'react'
import { PortfolioAggregationContext } from '../context'
import { TOGGLE_VIEW_FORM_PANEL } from '../reducer'


/**
 * Hook for managing the logic of the `ViewFormPanel` component for the `PortfolioAggregation` component.
 * 
 * @returns An object containing functions and state variables for the `ViewFormPanel` component.
 */
export function useViewFormPanel() {
  const context = useContext(PortfolioAggregationContext)
  const [view, $setView] = useState(new Map<string, any>())
  const isEditing = !!context.state.viewForm.view

  useEffect(() => {
    if (isEditing) {
      $setView(new Map([
        ['title', context.state.viewForm.view.title],
        ['searchQuery', context.state.viewForm.view.searchQuery],
        ['iconName', context.state.viewForm.view.iconName],
      ]))
    } else {
      $setView(new Map())
    }
  }, [context.state.viewForm, context.state.currentView])

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

  const onSave = async () => {
    const { currentView } = context.state
    let properties: SPDataSourceItem = {
      Title: view.get('title'),
      GtSearchQuery: view.get('searchQuery'),
      GtIconName: view.get('iconName')
    }
    if (isEditing) {
      await context.props.dataAdapter.portalDataService.updateItemInList(
        'DATA_SOURCES',
        currentView.id as number,
        properties
      )
    } else {
      properties = {
        ...properties,
        GtProjectContentColumnsId: {
          results: currentView.columns.map((column) => column.id)
        },
        GtProjectContentRefinersId: {
          results: currentView.refiners.map((refiner) => refiner.id)
        },
        GtProjectContentGroupById: currentView.groupBy?.id,
        GtDataSourceCategory: context.props.dataSourceCategory,
        GtDataSourceLevel: [context.props.configuration?.level].filter(Boolean)
      }
      await context.props.dataAdapter.portalDataService.addItemToList('DATA_SOURCES', properties)
    }
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

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

  /**
   * Determines whether the save button should be disabled based on the length of the view title and search query.
   */
  const isSaveDisabled = view.get('title')?.length < 2 || view.get('searchQuery')?.length < 51

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing: false,
    onDismiss,
    view,
    setView,
  } as const
}
