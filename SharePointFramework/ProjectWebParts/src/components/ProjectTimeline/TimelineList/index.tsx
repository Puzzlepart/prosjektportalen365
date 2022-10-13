import React, { useContext, useState } from 'react'
import { FunctionComponent } from 'react'
import { stringIsNullOrEmpty, TypedHash } from '@pnp/common'
import styles from './TimelineList.module.scss'
import { get } from '@microsoft/sp-lodash-subset'
import moment from 'moment'
import { tryParseCurrency } from 'pp365-shared/lib/helpers'
import {
  getId,
  IColumn,
  ICommandBarProps,
  CommandBar,
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode
} from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import { Logger, LogLevel } from '@pnp/logging'
import { ProjectTimelineContext } from '../context'
import { IBaseWebPartComponentProps } from 'components/BaseWebPartComponent'

export interface ITimelineListProps extends IBaseWebPartComponentProps {
  isSelectionModeNone?: boolean
}

export const TimelineList: FunctionComponent<ITimelineListProps> = (props) => {
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
   * Create new timeline item and send the user to the edit form
   */
  const redirectNewTimelineItem = async () => {
    const [project] = (
      await context.props.web.lists
        .getByTitle(strings.ProjectsListName)
        .items.select('Id', 'GtSiteId')
        .top(500)
        .get()
    ).filter(({ GtSiteId }) => GtSiteId === context.props.siteId)

    const properties: TypedHash<any> = {
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
  const addTimelineItem = async (properties: TypedHash<any>): Promise<any> => {
    const list = context.props.web.lists.getByTitle(strings.TimelineContentListName)
    const itemAddResult = await list.items.add(properties)
    return itemAddResult.data
  }

  /**
   * Delete timelineitem
   *
   * @param item Item
   */
  const deleteTimelineItem = async (item: any) => {
    const list = context.props.web.lists.getByTitle(strings.TimelineContentListName)
    await list.items.getById(item.Id).delete()
    try {
      // TODO: Make this refresh list without reloading the page
      document.location.reload()
    } catch (error) {
      context.setState({ error, loading: false })
    }
  }

  /**
   * Edit form URL with added Source parameter generated from the item ID
   *
   * @param item Item
   */
  const editFormUrl = (item: any) => {
    return [
      `${context.props.hubSite.url}`,
      `/Lists/${strings.TimelineContentListName}/EditForm.aspx`,
      '?ID=',
      item.Id,
      '&Source=',
      encodeURIComponent(window.location.href)
    ].join('')
  }

  return (
    <>
      <div className={styles.timelineList}>
        {context.props.showCmdTimelineList && (
          <div className={styles.commandBar}>
            <CommandBar {...getCommandBarProps()} />
          </div>
        )}
        <DetailsList
          columns={context.state.data.timelineColumns}
          items={context.state.data.timelineListItems}
          onRenderItemColumn={onRenderItemColumn}
          selection={selection}
          selectionMode={props.isSelectionModeNone ? SelectionMode.none : SelectionMode.single}
          layoutMode={DetailsListLayoutMode.justified}
        />
      </div>
    </>
  )
}
