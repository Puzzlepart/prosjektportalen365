import { DataSource, SPDataSourceItem } from 'pp365-shared-library'
import { usePortfolioAggregationContext } from '../context'
import { SET_VIEW_FORM_PANEL } from '../reducer'
import { useEditableView } from './useEditableView'

/**
 * Hook for managing the logic of the `ViewFormPanel` component for the `PortfolioAggregation` component.
 *
 * @returns An object containing functions and state variables for the `ViewFormPanel` component.
 */
export function useViewFormPanel() {
  const context = usePortfolioAggregationContext()
  const { view, setView, isEditing } = useEditableView()

  /**
   * Dismisses the form panel by dispatching the `SET_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the column to the list. If the column is new, it will
   * also add the column to the current view. If the column is
   * being edited, it will update the column in the list.
   *
   * If the column is being edited, it will update the column in the list
   * using `updateItemInList` from the `dataAdapter`. If the column is new,
   * it will add the column to the list using `addItemToList` from
   * the `dataAdapter`.
   */
  const onSave = async () => {
    const { currentView } = context.state
    let properties: SPDataSourceItem = {
      Title: view.get('title'),
      GtSearchQuery: view.get('searchQuery'),
      GtIconName: view.get('iconName')
    }
    try {
      if (isEditing) {
        await context.props.dataAdapter.portalDataService.updateItemInList(
          'DATA_SOURCES',
          currentView.id as number,
          properties
        )
        context.dispatch(
          SET_VIEW_FORM_PANEL({
            isOpen: false,
            submitAction: 'edit',
            view: currentView.update(properties)
          })
        )
      } else {
        properties = {
          ...properties,
          GtProjectContentColumnsId: currentView.columnIds,
          GtProjectContentRefinersId: currentView.refinerIds,
          GtProjectContentGroupById: currentView.groupById,
          GtDataSourceCategory: context.props.dataSourceCategory,
          GtDataSourceLevel: [context.props.configuration?.level]
        }
        const newView = await context.props.dataAdapter.portalDataService.addItemToList(
          'DATA_SOURCES',
          properties
        )

        context.dispatch(
          SET_VIEW_FORM_PANEL({
            isOpen: false,
            submitAction: 'add',
            view: new DataSource(
              {
                ...properties,
                Id: newView.Id
              },
              currentView.columns
            )
          })
        )
      }
    } catch (error) {
      throw new Error(error)
    }
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
