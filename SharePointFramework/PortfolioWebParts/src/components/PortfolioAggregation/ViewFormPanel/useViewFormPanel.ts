import { SPDataSourceItem } from 'pp365-shared-library'
import { useContext } from 'react'
import { PortfolioAggregationContext } from '../context'
import { TOGGLE_VIEW_FORM_PANEL } from '../reducer'
import { useEditableView } from './useEditableView'

/**
 * Hook for managing the logic of the `ViewFormPanel` component for the `PortfolioAggregation` component.
 *
 * @returns An object containing functions and state variables for the `ViewFormPanel` component.
 */
export function useViewFormPanel() {
  const context = useContext(PortfolioAggregationContext)
  const { view, setView, isEditing } = useEditableView()

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the changes made to the view by updating the item in the `DATA_SOURCES` list or adding a new item to the list.
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   */
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
          results: currentView.columnIds
        },
        GtProjectContentRefinersId: {
          results: currentView.refinerIds
        },
        GtProjectContentGroupById: currentView.groupById,
        GtDataSourceCategory: context.props.dataSourceCategory,
        GtDataSourceLevel: {
          results: [context.props.configuration?.level].filter(Boolean)
        }
      }
      await context.props.dataAdapter.portalDataService.addItemToList('DATA_SOURCES', properties)
    }
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Determines whether the save button should be disabled based on the length of the view title and search query.
   */
  const isSaveDisabled = view.get('title').length < 2 || view.get('searchQuery').length < 51

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing: false,
    onDismiss,
    view,
    setView
  } as const
}
