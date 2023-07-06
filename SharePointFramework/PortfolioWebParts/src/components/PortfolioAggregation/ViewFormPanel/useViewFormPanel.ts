import { SPPortfolioOverviewViewItem } from 'pp365-shared-library'
import { useContext, useState } from 'react'
import { PortfolioAggregationContext } from '../context'


/**
 * Hook for managing the logic of the `ViewFormPanel` component for the `PortfolioAggregation` component.
 * 
 * @returns An object containing functions and state variables for the `ViewFormPanel` component.
 */
export function useViewFormPanel() {
  const context = useContext(PortfolioAggregationContext)
  const [view, $setView] = useState(new Map<string, any>([
    ['title', ''],
    ['searchQuery', ''],
  ]))
  const isEditing = false

  // useEffect(() => {
  //   if (isEditing) {
  //     $setView(new Map())
  //   } else {
  //     $setView(new Map())
  //   }
  // }, [context.state.currentView])

  /**
   * Dismisses the form panel by dispatching the `TOGGLE_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    // TODO: Dispatch action to close the form panel
    // context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))
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
      }
      await context.props.dataAdapter.portalDataService.addItemToList('PORTFOLIO_VIEWS', properties)
    }
    //context.dispatch(TOGGLE_VIEW_FORM_PANEL({ isOpen: false }))

    // TODO: Dispatch action to close the form panel
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
   * Save is disabled if the view title is less than 2 characters or the search query is less than 51 characters.
   */
  const isSaveDisabled = view.get('title').length < 2 || view.get('searchQuery').length < 51

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing: false,
    onDismiss,
    view,
    setView,
  } as const
}
