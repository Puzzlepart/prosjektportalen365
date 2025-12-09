import { useCallback, useContext, useMemo } from 'react'
import { DynamicListContext } from '../context'
import { IColumn } from '@fluentui/react'

/**
 * Hook for EditViewColumnsPanel functionality in DynamicList.
 *
 * Provides panel configuration for editing column visibility and order.
 * Changes are stored in session storage (not persisted to SharePoint).
 *
 * @returns Props for EditViewColumnsPanel component
 */
export function useEditViewColumnsPanel() {
  const context = useContext(DynamicListContext)

  const columns = useMemo(
    () =>
      (context.state.data?.listColumns || []).map((col: IColumn) => ({
        ...col,
        isSelected: true
      })),
    [context.state.data?.listColumns]
  )

  const onSaveViewColumns = useCallback(
    (selectedColumns: IColumn[], columnIds: number[]) => {
      const sessionKey = `DynamicList_${context.props.listName}_ColumnOrder`
      sessionStorage.setItem(sessionKey, JSON.stringify(columnIds))

      context.setState({
        isEditViewColumnsPanelOpen: false,
        customColumnOrder: columnIds
      })
    },
    [context.props.listName]
  )

  const onRevertViewColumnOrder = useCallback(() => {
    const sessionKey = `DynamicList_${context.props.listName}_ColumnOrder`
    sessionStorage.removeItem(sessionKey)

    context.setState({
      isEditViewColumnsPanelOpen: false,
      customColumnOrder: null
    })
  }, [context.props.listName])

  const onDismiss = useCallback(() => {
    context.setState({ isEditViewColumnsPanelOpen: false })
  }, [])

  return {
    isOpen: context.state.isEditViewColumnsPanelOpen,
    columns,
    onSave: onSaveViewColumns,
    onDismiss,
    revertOrder: {
      disabled: !context.state.customColumnOrder?.length,
      onClick: onRevertViewColumnOrder
    },
    helpText: 'Velg kolonner og rekkefølge. Endringer lagres kun i økten (ikke permanent).',
    customColumnOrder: context.state.customColumnOrder
  }
}
