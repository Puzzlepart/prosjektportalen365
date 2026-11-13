import strings from 'PortfolioWebPartsStrings'
import { DataSource, SPDataSourceItem } from 'pp365-shared-library'
import { useTelemetry } from 'pp365-shared-library/lib/telemetry'
import { useEffect, useState } from 'react'
import { usePortfolioAggregationContext } from '../context'
import { SET_VIEW_FORM_PANEL } from '../reducer'
import { useEditableView } from './useEditableView'
import { useId } from '@fluentui/react-components'

/**
 * Validate and save aggregation data-source views and manage editor dismissal. A save the list
 * refuses is told in the form, which stays open with what was typed, and counted for usage
 * statistics, once, by its error code.
 */
export function useViewFormPanel() {
  const context = usePortfolioAggregationContext()
  const { view, setView, isEditing } = useEditableView()
  const telemetry = useTelemetry()
  // A save writes to the data sources list in the hub, where SharePoint enforces the permission.
  // A user the menu let in but the list refuses must be told, not left with a form that did
  // nothing: the error was thrown on to a button's click handler, which shows no one anything.
  const [saveError, setSaveError] = useState<string>()

  // The form stays mounted while it is closed, and its cancel button closes it past `onDismiss`:
  // a refusal it told of is gone whenever it closes or opens again.
  useEffect(() => setSaveError(undefined), [context.state.viewForm])

  /**
   * Dismisses the form panel by dispatching the `SET_VIEW_FORM_PANEL` action.
   */
  const onDismiss = () => {
    context.dispatch(SET_VIEW_FORM_PANEL({ isOpen: false }))
  }

  /**
   * Save the data-source view, copying columns, refiners and grouping for a new view. A save the
   * list refuses leaves the form open and says so in it.
   */
  const onSave = async () => {
    setSaveError(undefined)
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
      telemetry.trackError(error)
      setSaveError(strings.ViewSaveErrorText)
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
    saveError,
    fluentProviderId
  } as const
}
