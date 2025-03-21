import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ProjectColumn } from 'pp365-shared-library'
import { useMemo } from 'react'
import {
  EditViewColumnsPanelSortMode,
  IEditViewColumnsPanelProps
} from '../../EditViewColumnsPanel/types'
import { IPortfolioOverviewContext } from '../context'
import { TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from '../reducer'

/**
 * Creates props for `EditViewColumnsPanel` component based on the context (`IPortfolioOverviewContext`)
 *
 * @param context Context for `PortfolioOverview` component
 */
export function useEditViewColumnsPanel(
  context: IPortfolioOverviewContext
): IEditViewColumnsPanelProps {
  /**
   * Add `isSelected` property to `props.configuration.columns` based on `state.columns`.
   * Sorts columns based on `state.currentView.columnOrder` if it exists. The selected columns
   * will always be on top. The rest of the columns will be sorted based on their `sortOrder`
   * from the project columns list.
   */
  const columnsWithSelectedState = useMemo(
    () =>
      context.props.configuration.columns.map((c) =>
        c.setData({ isSelected: _.some(context.state.columns, (_c) => _c.id === c.id) })
      ),
    [context.state.columns, context.state.currentView]
  )

  /**
   * On save view columns callback sent to `EditViewColumnsPanel`.
   *
   * @param columns Selected columns
   * @param columnIds Selected column IDs
   */
  const onSaveViewColumns = async (columns: ProjectColumn[], columnIds: number[]) => {
    const properties: Record<string, any> = {
      GtPortfolioColumnsId: columnIds,
      GtPortfolioColumnOrder: JSON.stringify(columnIds)
    }

    await context.props.dataAdapter.portalDataService.updateItemInList(
      'PORTFOLIO_VIEWS',
      context.state.currentView.id as number,
      properties
    )

    context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns }))
  }

  /**
   * On revert view column order callback sent to `EditViewColumnsPanel`.
   *
   * @param selectedColumns Selected columns
   */
  const onRevertViewColumnOrder = async (selectedColumns: ProjectColumn[]) => {
    const columns = selectedColumns
      .filter((c) => c.data.isSelected)
      .sort((a, b) => a.sortOrder - b.sortOrder)

    const properties: Record<string, any> = {
      GtPortfolioColumnOrder: null
    }

    await context.props.dataAdapter.portalDataService.updateItemInList(
      'PORTFOLIO_VIEWS',
      context.state.currentView.id as number,
      properties
    )

    context.dispatch(
      TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false, columns, revertColumnOrder: true })
    )
  }

  return {
    isOpen: context.state.isEditViewColumnsPanelOpen,
    columns: columnsWithSelectedState,
    onSave: onSaveViewColumns,
    onDismiss: () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false })),
    revertOrder: {
      disabled: _.isEmpty(context.state.currentView?.columnOrder),
      onClick: onRevertViewColumnOrder
    },
    helpText: strings.PortfolioOverviewShowEditViewColumnsPanelHelpText,
    customColumnOrder: context.state.currentView?.columnOrder,
    sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop
  } as IEditViewColumnsPanelProps
}
