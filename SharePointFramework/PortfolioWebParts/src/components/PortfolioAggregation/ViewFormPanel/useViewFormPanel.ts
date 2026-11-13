import { DataSource, SPDataSourceItem } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { usePortfolioAggregationContext } from '../context'
import { SET_VIEW_FORM_PANEL } from '../reducer'
import { useEditableView } from './useEditableView'
import { useId } from '@fluentui/react-components'

/**
 * Validate and save aggregation data-source views and manage editor dismissal. A save the list
 * refuses is counted for usage statistics, once, by its error code.
 */
export function useViewFormPanel() {
  const context = usePortfolioAggregationContext()
  const { view, setView, isEditing } = useEditableView()
  const telemetry = useTelemetry()

  /**
   * Dismisses the form panel by dispatching the `SET_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Save the data-source view, copying columns, refiners and grouping for a new view.
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
      // Counted by what the list answered: the error thrown on keeps only its text.
      telemetry.trackError(error)
      throw new Error(error)
    }
  }

  /**
   * Determines whether the save button should be disabled based on the length of the view title and search query.
   * A data source saved without a search query has none, and the form failed as it opened to edit
   * it.
   */
  const isSaveDisabled =
    (view.get('title') ?? '').length < 2 || (view.get('searchQuery') ?? '').length < 51

  const fluentProviderId = useId('fp-view-form-panel')

  return {
    onSave: !isSaveDisabled ? onSave : undefined,
    isEditing,
    onDismiss,
    view,
    setView,
    fluentProviderId
  } as const
}
