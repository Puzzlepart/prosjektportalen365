import _ from 'lodash'
import { PortfolioOverviewView, SPPortfolioOverviewViewItem } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { CHANGE_VIEW, SET_VIEW_FORM_PANEL } from '../reducer'
import { useEditableView } from './useEditableView'
import { useId } from '@fluentui/react-components'
import { usePortfolioOverviewContext } from '../context'

/**
 * Validate and save portfolio views and manage the view editor's dismissal. A view the list has
 * taken, new or edited, is counted for usage statistics, for the web part the overview is in.
 */
export function useViewFormPanel() {
  const context = usePortfolioOverviewContext()
  const { view, setView, isEditing } = useEditableView()
  const telemetry = useTelemetry()

  /**
   * Close the view editor.
   */
  const onDismiss = () => {
    context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Saves the changes made to the view. If the view is being edited, the changes are updated in the
   * `PORTFOLIO_VIEWS` list. If the view is new, a new item is added to the `PORTFOLIO_VIEWS` list.
   * Close the editor after switching to the saved view.
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
      await context.props.dataAdapter.portalDataService.updateItemInList(
        'PORTFOLIO_VIEWS',
        currentView.id as number,
        properties
      )
      const updatedView = new PortfolioOverviewView({
        ...properties,
        Id: currentView.id as number,
        GtPortfolioColumnsId: currentView.columnIds,
        GtPortfolioRefinersId: currentView.refinerIds,
        GtPortfolioGroupById: currentView.groupById,
        GtPortfolioColumnOrder: JSON.stringify(currentView.columnOrder)
      }).configure(currentView.columns)

      const viewIndex = context.props.configuration.views.findIndex((v) => v.id === currentView.id)
      if (viewIndex !== -1) {
        context.props.configuration.views[viewIndex] = updatedView
      }

      context.dispatch(CHANGE_VIEW(updatedView))
    } else {
      properties = {
        ...properties,
        GtPortfolioColumnsId: currentView.columnIds,
        GtPortfolioRefinersId: currentView.refinerIds,
        GtPortfolioGroupById: currentView.groupById,
        GtPortfolioColumnOrder: JSON.stringify(currentView.columnOrder)
      }
      const view = await context.props.dataAdapter.portalDataService.addItemToList(
        'PORTFOLIO_VIEWS',
        properties
      )

      const newView = new PortfolioOverviewView({
        ...properties,
        Id: view.Id
      }).configure(currentView.columns)

      context.props.configuration.views.push(newView)
      context.dispatch(CHANGE_VIEW(newView))
    }
    // The list has taken the view by now: a save it refused never gets here.
    telemetry.track('view.saved')
    context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Save is disabled if the view title is less than 2 characters or the search query is less than 51 characters.
   * A view saved without a search query has none, and the form failed as it opened to edit it.
   */
  const isSaveDisabled =
    (view.get('title') ?? '').length < 2 || (view.get('searchQuery') ?? '').length < 51

  /**
   * `true` if any of the views is set as the default view and the current view is not the default view.
   */
  const isDefaultViewSet = _.some(
    context.props.configuration.views,
    (v) => v.isDefaultView && v.id !== view.get('id')
  )

  const fluentProviderId = useId('fp-view-form-panel')

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing,
    onDismiss,
    view,
    setView,
    isDefaultViewSet,
    fluentProviderId
  } as const
}
