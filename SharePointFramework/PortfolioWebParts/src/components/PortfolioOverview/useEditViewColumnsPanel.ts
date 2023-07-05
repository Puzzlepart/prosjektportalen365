import strings from 'PortfolioWebPartsStrings'
import _ from 'lodash'
import { ProjectColumn } from 'pp365-shared-library'
import { useMemo } from 'react'
import { IEditViewColumnsPanelProps } from '../EditViewColumnsPanel/types'
import { IPortfolioOverviewContext } from './context'
import { TOGGLE_EDIT_VIEW_COLUMNS_PANEL } from './reducer'

/**
 * Creates props for `EditViewColumnsPanel` component based on the context.
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
      context.props.configuration.columns
        .map((c) =>
          c.setData({ isSelected: _.some(context.state.columns, (_c) => _c.id === c.id) })
        )
        .sort((a, b) => {
          const customColumnOrder = context.state?.currentView?.columnOrder ?? []
          const customColumnOrderIndexA = customColumnOrder.indexOf(a.id)
          const customColumnOrderIndexB = customColumnOrder.indexOf(b.id)
          if (a.data.isSelected && !b.data.isSelected) {
            return -1
          } else if (!a.data.isSelected && b.data.isSelected) {
            return 1
          } else if (customColumnOrderIndexA !== -1 && customColumnOrderIndexB !== -1) {
            return customColumnOrderIndexA - customColumnOrderIndexB || a.sortOrder - b.sortOrder
          } else if (customColumnOrderIndexA !== -1) {
            return -1
          } else if (customColumnOrderIndexB !== -1) {
            return 1
          } else {
            return a.sortOrder - b.sortOrder
          }
        }),
    [context.state.columns, context.state.currentView]
  )

  /**
   * On save view columns callback sent to `EditViewColumnsPanel`.
   *
   * @param columns Selected columns
   */
  const onSaveViewColumns = async (columns: ProjectColumn[]) => {
    const properties: Record<string, any> = {
      GtPortfolioColumnsId: {
        results: columns.map((c) => c['id'])
      },
      GtPortfolioColumnOrder: JSON.stringify(columns.map((c) => c['id']))
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
    helpText: strings.PortfolioOverviewShowEditViewColumnsPanelHelpText
  } as IEditViewColumnsPanelProps
}
