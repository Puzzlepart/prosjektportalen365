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
 */
export function useEditViewColumnsPanel(
  context: IPortfolioOverviewContext
): IEditViewColumnsPanelProps {
  /**
   * Merge configuration and current view columns and mark selection; the panel sorts them.
   *
   * The configuration is the list as the page loaded it: a column added or edited since is as it
   * is now only among the view's columns, and one deleted since is still in it. The panel listed
   * the deleted column, the edited one as it was, and left the added one out, so «Bruk» took the
   * added column out of the view and put the edited one back as it was.
   */
  const columnsWithSelectedState = useMemo(() => {
    const configured = context.props.configuration.columns
    const viewColumns = context.state.columns ?? []
    const deletedColumnIds = context.state.deletedColumnIds ?? []
    const current = configured.map((c) => _.find(viewColumns, (_c) => _c.id === c.id) ?? c)
    const added = viewColumns.filter(
      (c) => c.id != null && !configured.some((_c) => _c.id === c.id)
    )
    return [...current, ...added]
      .filter((c) => !deletedColumnIds.includes(c.id))
      .map((c) => c.setData({ isSelected: _.some(viewColumns, (_c) => _c.id === c.id) }))
  }, [context.state.columns, context.state.currentView, context.state.deletedColumnIds])

  /**
   * On save view columns callback sent to `EditViewColumnsPanel`.
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
   * @param selectedColumns All selectable columns, including unselected ones.
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
    open: context.state.isEditViewColumnsPanelOpen,
    columns: columnsWithSelectedState,
    onSave: onSaveViewColumns,
    onClose: () => context.dispatch(TOGGLE_EDIT_VIEW_COLUMNS_PANEL({ isOpen: false })),
    revertOrder: {
      disabled: _.isEmpty(context.state.currentView?.columnOrder),
      onClick: onRevertViewColumnOrder
    },
    helpText: strings.PortfolioOverviewShowEditViewColumnsPanelHelpText,
    customColumnOrder: context.state.currentView?.columnOrder,
    sortMode: EditViewColumnsPanelSortMode.CustomSelectedOnTop
  } as IEditViewColumnsPanelProps
}
