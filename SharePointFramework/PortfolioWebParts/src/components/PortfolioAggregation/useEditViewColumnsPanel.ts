import _ from 'lodash'
import { ProjectContentColumn, SPDataSourceItem } from 'pp365-shared-library'
import { useMemo } from 'react'
import { IEditViewColumnsPanelProps } from '../EditViewColumnsPanel/types'
import { IPortfolioAggregationContext } from './context'
import { SET_COLUMNS, TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from './reducer'

/**
 * Creates props for `EditViewColumnsPanel` component based on the context.
 *
 * @param context Context for `PortfolioAggregation` component
 */
export function useEditViewColumnsPanel(
  context: IPortfolioAggregationContext
): IEditViewColumnsPanelProps {
  /**
   * Add `isSelected` property to `context.state.columns` based on `context.state.dataSourceColumns`.
   */
  const columnsWithSelectedState = useMemo(
    () =>
      context.state.columns.map((c) => ({
        ...c,
        data: {
          ...c.data,
          isSelected: _.some(context.state.dataSourceColumns, (_c) => _c.fieldName === c.fieldName)
        }
      })),
    [context.state.columns, context.state.dataSourceColumns]
  )

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

  return {
    isOpen: context.state.isEditViewColumnsPanelOpen,
    columns: columnsWithSelectedState,
    onSave: onSaveViewColumns,
    onDismiss,
    sortMode: 'selectedOnTop'
  } as IEditViewColumnsPanelProps
}
