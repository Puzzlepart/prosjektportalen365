import _ from 'lodash'
import { SPPortfolioOverviewViewItem } from 'pp365-shared-library'
import { TOGGLE_VIEW_FORM_PANEL } from '../reducer'
import { usePortfolioOverviewContext } from '../usePortfolioOverviewContext'
import { useEditableView } from './useEditableView'

/**
 * Component logic hook for `ViewFormPanel`.
 */
export function useViewFormPanel() {
  const context = usePortfolioOverviewContext()
  const { view, setView, isEditing } = useEditableView()

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the changes made to the view. If the view is being edited, the changes are updated in the
   * `PORTFOLIO_VIEWS` list. If the view is new, a new item is added to the `PORTFOLIO_VIEWS` list.
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   *
   * If the view is being edited, the `Title`, `GtSortOrder`, `GtSearchQuery`, `GtPortfolioIsPersonalView`,
   * `GtPortfolioIsDefaultView`, and `GtPortfolioFabricIcon` properties are updated.
   *
   * If the view is new, the `GtPortfolioColumnsId`, `GtPortfolioRefinersId`, `GtPortfolioGroupById`,
   * and `GtPortfolioColumnOrder` properties are set in addition to the properties mentioned above.
   */
  const onSave = async () => {
    const { currentView } = context.state
    let properties: SPPortfolioOverviewViewItem = {
      Title: view.get('title'),
      GtSortOrder: view.get('sortOrder'),
      GtSearchQuery: view.get('searchQuery'),
      GtPortfolioIsPersonalView: view.get('isPersonalView'),
      GtPortfolioIsDefaultView: view.get('isDefaultView'),
      GtPortfolioFabricIcon: view.get('iconName')
    }
    if (isEditing) {
      context.props.dataAdapter.portalDataService.updateItemInList(
        'PORTFOLIO_VIEWS',
        currentView.id as number,
        properties
      )
    } else {
      properties = {
        ...properties,
        GtPortfolioColumnsId: {
          results: currentView.columnIds
        },
        GtPortfolioRefinersId: {
          results: currentView.refinerIds
        },
        GtPortfolioGroupById: currentView.groupById,
        GtPortfolioColumnOrder: JSON.stringify(currentView.columnOrder)
      }
      await context.props.dataAdapter.portalDataService.addItemToList('PORTFOLIO_VIEWS', properties)
    }
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Save is disabled if the view title is less than 2 characters or the search query is less than 51 characters.
   */
  const isSaveDisabled = view.get('title').length < 2 || view.get('searchQuery').length < 51

  /**
   * `true` if any of the views is set as the default view and the current view is not the default view.
   */
  const isDefaultViewSet = _.some(
    context.props.configuration.views,
    (v) => v.isDefaultView && v.id !== view.get('id')
  )

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing,
    onDismiss,
    view,
    setView,
    isDefaultViewSet
  } as const
}
