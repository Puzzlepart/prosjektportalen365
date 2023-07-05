import _ from 'lodash'
import { IProjectContentColumn } from 'pp365-shared-library'
import { useMemo } from 'react'
import { IEditViewColumnsPanelProps } from '../EditViewColumnsPanel/types'
import { IPortfolioAggregationContext } from './context'
import { SHOW_HIDE_COLUMNS } from './reducer'

/**
 * Creates props for `EditViewColumnsPanel` component based on the context.
 *
 * @param context Context for `PortfolioAggregation` component
 */
export function useEditViewColumnsPanel(
  context: IPortfolioAggregationContext
): IEditViewColumnsPanelProps {
  /**
   * Add `isSelected` property to `props.configuration.columns` based on `state.columns`.
   */
  const columnsWithSelectedState = useMemo(
    () =>
      context.state.columns.map((c) => ({
        ...c,
        data: {
          ...c.data,
          isSelected: _.some(context.state.fltColumns, (_c) => _c.fieldName === c.fieldName)
        }
      })),
    [context.state.columns, context.state.currentView]
  )

  /**
   * On save view columns callback sent to `EditViewColumnsPanel`.
   *
   * @param columns Selected columns
   */
  const onSaveViewColumns = async (columns: IProjectContentColumn[]) => {
    const updateItems = {
      GtProjectContentColumnsId: columns.map((c) => c.id)
    }

    await Promise.resolve(
      context.props.dataAdapter
        .updateDataSourceItem(updateItems, context.state.dataSource, true)
        .then(() => {
          context.dispatch(SHOW_HIDE_COLUMNS())
        })
        .catch((error) => (context.state.error = error))
    )
  }

  return {
    isOpen: context.state.showHideColumnPanel.isOpen,
    columns: columnsWithSelectedState,
    onSave: onSaveViewColumns,
  } as IEditViewColumnsPanelProps
}
