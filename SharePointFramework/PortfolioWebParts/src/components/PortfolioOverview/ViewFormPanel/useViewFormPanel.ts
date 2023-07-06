import _ from 'lodash'
import { SPPortfolioOverviewViewItem } from 'pp365-shared-library'
import { useContext } from 'react'
import { PortfolioOverviewContext } from '../context'
import { TOGGLE_VIEW_FORM_PANEL } from '../reducer'
import { useEditableView } from './useEditableView'

/**
 * Component logic hook for `ViewFormPanel`.
 */
export function useViewFormPanel() {
  const context = useContext(PortfolioOverviewContext)
  const { view, setView, isEditing } = useEditableView()

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
  }

  const onSave = async () => {
    const { currentView } = context.state
    if (isEditing) {
      const properties: SPPortfolioOverviewViewItem = {
        Title: view.get('title'),
        GtSearchQuery: view.get('searchQuery'),
        GtPortfolioIsPersonalView: view.get('isPersonalView'),
        GtPortfolioIsDefaultView: view.get('isDefaultView'),
        GtPortfolioFabricIcon: view.get('iconName')
      }
      await context.props.dataAdapter.portalDataService.updateItemInList(
        'PORTFOLIO_VIEWS',
        currentView.id as number,
        properties
      )
    } else {
      const properties: SPPortfolioOverviewViewItem = {
        Title: view.get('title'),
        GtSearchQuery: view.get('searchQuery'),
        GtSortOrder: view.get('sortOrder'),
        GtPortfolioFabricIcon: view.get('iconName'),
        GtPortfolioIsDefaultView: view.get('isDefaultView'),
        GtPortfolioIsPersonalView: view.get('isPersonalView'),
        GtPortfolioColumnsId: {
          results: currentView.columns.map((column) => column.id)
        },
        GtPortfolioRefinersId: {
          results: currentView.refiners.map((refiner) => refiner.id)
        },
        GtPortfolioGroupById: currentView.groupBy?.id,
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
   * `true` if any of the views is set as the default view.
   */
  const isDefaultViewSet = _.some(context.props.configuration.views, (v) => v.isDefaultView)

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing: false,
    onDismiss,
    view,
    setView,
    isDefaultViewSet
  } as const
}
