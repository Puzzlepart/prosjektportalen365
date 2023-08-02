import { getId, IColumn, ICommandBarProps, Selection } from '@fluentui/react'
import { get } from '@microsoft/sp-lodash-subset'
import { stringIsNullOrEmpty } from '@pnp/core'
import { Logger, LogLevel } from '@pnp/logging'
import SPDataAdapter from 'data/SPDataAdapter'
import moment from 'moment'
import { tryParseCurrency } from 'pp365-shared-library/lib/util/tryParseCurrency'
import strings from 'ProjectWebPartsStrings'
import { useContext, useState } from 'react'
import { ProjectTimelineContext } from '../context'

export function useTimelineList() {
  const context = useContext(ProjectTimelineContext)
  const [selectedItem, setSelectedItem] = useState([])

  const selection: Selection = new Selection({
    onSelectionChanged: () => {
      setSelectedItem(selection.getSelection())
    }
  })

  /**
   * On render item column
   *
   * @param item Item
   * @param index Index
   * @param column Column
   */
  const onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    if (!column.fieldName) return null
    if (column.onRender) return column.onRender(item, index, column)
    if (!stringIsNullOrEmpty(column['fieldNameDisplay'])) {
      return get(item, column['fieldNameDisplay'], null)
    }
    const columnValue = get(item, column.fieldName, null)

    switch (column?.data?.type.toLowerCase()) {
      case 'int':
        return columnValue ? parseInt(columnValue) : null
      case 'date':
        return columnValue && moment(columnValue).format('DD.MM.YYYY')
      case 'datetime':
        return columnValue && moment(columnValue).format('DD.MM.YYYY')
      case 'currency':
        return tryParseCurrency(columnValue)
      case 'lookup':
        return columnValue && columnValue.Title
      default:
        return columnValue
    }
  }

  /**
   * Get command bar items
   */
  const getCommandBarProps = (): ICommandBarProps => {
    const cmd: ICommandBarProps = { items: [], farItems: [] }
    cmd.items.push({
      key: getId('NewItem'),
      name: strings.NewItemLabel,
      iconProps: { iconName: 'Add' },
      buttonStyles: { root: { border: 'none' } },
      onClick: () => {
        redirectNewTimelineItem()
      }
    })
    cmd.items.push({
      key: getId('EditItem'),
      name: strings.EditItemLabel,
      iconProps: { iconName: 'Edit' },
      buttonStyles: { root: { border: 'none' } },
      disabled: selectedItem.length === 0,
      href: selectedItem[0]?.EditFormUrl
    })
    cmd.farItems.push({
      key: getId('DeleteItem'),
      name: strings.DeleteItemLabel,
      iconProps: { iconName: 'Delete' },
      buttonStyles: { root: { border: 'none' } },
      disabled: selectedItem.length === 0,
      onClick: () => {
        deleteTimelineItem(selectedItem[0])
      }
    })
    return cmd
  }

  /**
   * Create new timeline item and send the user to the edit form.
   */
  const redirectNewTimelineItem = async () => {
    // TODO: Add a filter to the query instead of filtering the result after fetching all items.
    const [project] = (
      await SPDataAdapter.portal.web.lists
        .getByTitle(strings.ProjectsListName)
        .items.select('Id', 'GtSiteId')
        .getAll()
    ).filter(({ GtSiteId }) => GtSiteId === context.props.siteId)

    const properties: Record<string, any> = {
      Title: 'Nytt element på tidslinjen',
      GtSiteIdLookupId: project.Id
    }

    Logger.log({
      message: '(TimelineItem) _redirectNewTimelineItem: Created new timeline item',
      data: { fieldValues: properties },
      level: LogLevel.Info
    })

    const itemId = await addTimelineItem(properties)
    document.location.hash = ''
    document.location.href = editFormUrl(itemId)
  }

  /**
   * Add timeline item
   *
   * @param properties Properties
   */
  const addTimelineItem = async (properties: Record<string, any>): Promise<any> => {
    const list = SPDataAdapter.portal.web.lists.getByTitle(strings.TimelineContentListName)
    const itemAddResult = await list.items.add(properties)
    return itemAddResult.data
  }

  /**
   * Delete timelineitem
   *
   * @param item Item
   */
  const deleteTimelineItem = async (item: any) => {
    const list = SPDataAdapter.portal.web.lists.getByTitle(strings.TimelineContentListName)
    await list.items.getById(item.Id).delete()
    context.setState({
      refetch: new Date().getTime()
    })
  }

  /**
   * Edit form URL with added Source parameter generated from the item ID
   *
   * @param item Item
   */
  const editFormUrl = (item: any) => {
    return [
      `${SPDataAdapter.portal.url}`,
      `/Lists/${strings.TimelineContentListName}/EditForm.aspx`,
      '?ID=',
      item.Id,
      '&Source=',
      encodeURIComponent(window.location.href)
    ].join('')
  }

  /**
   * Copies and sorts items based on colum key
   *
   * @param items timelineListItems
   * @param columnKey Column key
   * @param isSortedDescending Is Sorted Descending?
   * @returns sorted timeline list items
   */
  const copyAndSort = (items: any[], columnKey: string, isSortedDescending?: boolean): any[] => {
    const key = columnKey as keyof any
    return items
      .slice(0)
      .sort((a: any, b: any) => ((isSortedDescending ? a[key] < b[key] : a[key] > b[key]) ? 1 : -1))
  }

  /**
   * Sorting on column header  click
   *
   * @param _event Event
   * @param column Column
   */
  const onColumnHeaderClick = (_event: React.MouseEvent<HTMLElement>, column: IColumn): void => {
    const newColumns = context.state.data.listColumns.map((col: IColumn) => {
      if (col.key === column.key) {
        col.isSortedDescending = !col.isSortedDescending
        col.isSorted = true
      } else {
        col.isSorted = false
        col.isSortedDescending = true
      }
      return col
    })
    const newItems = copyAndSort(
      context.state.data.listItems,
      column.fieldName,
      column.isSortedDescending
    )
    context.setState({
      data: { ...context.state.data, listColumns: newColumns, listItems: newItems }
    })
  }

  return { getCommandBarProps, onRenderItemColumn, selection, onColumnHeaderClick } as const
}
