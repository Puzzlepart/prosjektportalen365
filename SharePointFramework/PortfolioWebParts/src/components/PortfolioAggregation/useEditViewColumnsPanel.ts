import { ProjectContentColumn, SPDataSourceItem } from 'pp365-shared-library'
import { IEditViewColumnsPanelProps } from '../EditViewColumnsPanel/types'
import { IPortfolioAggregationContext } from './context'
import { TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from './reducer'
import { useMemo } from 'react'

/**
 * Creates props for `EditViewColumnsPanel` component based on the context.
 *
 * @param context Context for `PortfolioAggregation` component
 */
export function useEditViewColumnsPanel(
  context: IPortfolioAggregationContext
): IEditViewColumnsPanelProps {
  const onDismiss = () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false }))

  /**
   * On save view columns callback sent to `EditViewColumnsPanel`.
   *
   * @param columns Selected columns
   */
  const onSaveViewColumns = async (columns: ProjectContentColumn[]) => {
    const properties: SPDataSourceItem = {
      GtProjectContentColumnsId: columns.map((c) => c.id)
    }
    await context.props.dataAdapter.portalDataService
      .updateDataSourceItem('DATA_SOURCES', properties, context.state.currentView?.title, true)
      .then(() => {
        context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns }))
        onDismiss()
      })
  }

  return useMemo<IEditViewColumnsPanelProps>(
    () => ({
      isOpen: context.state.isEditViewColumnsPanelOpen,
      columns: context.state.allColumnsForCategory,
      onSave: onSaveViewColumns,
      onDismiss,
      sortMode: 'selectedOnTop',
      customColumnOrder: context.state.columns.map((c) => c.id)
    }),
    [
      context.state.isEditViewColumnsPanelOpen,
      context.state.columns,
      context.state.allColumnsForCategory
    ]
  )
}
