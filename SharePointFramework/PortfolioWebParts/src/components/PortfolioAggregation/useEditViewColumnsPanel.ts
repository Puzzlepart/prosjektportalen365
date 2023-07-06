import { ProjectContentColumn, SPDataSourceItem } from 'pp365-shared-library'
import { IEditViewColumnsPanelProps } from '../EditViewColumnsPanel/types'
import { IPortfolioAggregationContext } from './context'
import { SET_COLUMNS, TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from './reducer'
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
    await context.props.dataAdapter
      .updateDataSourceItem(properties, context.state.dataSource, true)
      .then(() => {
        context.dispatch(SET_COLUMNS({ columns }))
        onDismiss()
      })
  }

  return useMemo(
    () => ({
      isOpen: context.state.isEditViewColumnsPanelOpen,
      columns: context.state.allColumnsForCategory,
      onSave: onSaveViewColumns,
      onDismiss,
      sortMode: 'selectedOnTop'
    }),
    [context.state]
  )
}
