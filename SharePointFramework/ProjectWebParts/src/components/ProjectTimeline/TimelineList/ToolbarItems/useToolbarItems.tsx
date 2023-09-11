import { useMemo } from 'react'
import {
  AddFilled,
  AddRegular,
  bundleIcon,
  DeleteFilled,
  DeleteRegular,
  EditFilled,
  EditRegular
} from '@fluentui/react-icons'
import { IProjectTimelineProps, IProjectTimelineState } from 'components/ProjectTimeline/types'
import { ListMenuItem } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import { Logger, LogLevel } from '@pnp/logging'

/**
 * Object containing icons used in the toolbar.
 */
const Icons = {
  Add: bundleIcon(AddFilled, AddRegular),
  Edit: bundleIcon(EditFilled, EditRegular),
  Delete: bundleIcon(DeleteFilled, DeleteRegular)
}

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @param context - The IPortfolioOverviewContext object containing the necessary data for generating the toolbar items.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(
  props: IProjectTimelineProps,
  setState: (newState: Partial<IProjectTimelineState>) => void,
  selectedItems: any[]
) {
  /**
   * Create new timeline item and send the user to the edit form.
   */
  const redirectNewTimelineItem = async () => {
    const [project] = await SPDataAdapter.portal.web.lists
      .getByTitle(strings.ProjectsListName)
      .items.select('Id')
      .filter(`GtSiteId eq '${props.siteId}'`)()

    const properties: Record<string, any> = {
      Title: strings.NewItemLabel,
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
  const deleteTimelineItem = async (items: any) => {
    const list = SPDataAdapter.portal.web.lists.getByTitle(strings.TimelineContentListName)

    await items.forEach(async (item: any) => {
      await list.items.getById(item.Id).delete()
    })

    setState({
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

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.NewItemLabel, strings.NewItemLabel)
          .setIcon(Icons.Add)
          .setOnClick(() => {
            redirectNewTimelineItem()
          }),
        new ListMenuItem(strings.EditItemLabel, strings.EditItemLabel)
          .setIcon(Icons.Edit)
          .setDisabled(selectedItems.length !== 1)
          .setOnClick(() => {
            window.open(selectedItems[0]?.EditFormUrl, '_blank')
          })
      ].filter(Boolean),
    [props, selectedItems]
  )

  const farMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.DeleteItemLabel, strings.DeleteItemLabel)
          .setIcon(Icons.Delete)
          .setDisabled(selectedItems.length === 0)
          .setOnClick(() => {
            deleteTimelineItem(selectedItems)
          })
      ].filter(Boolean),
    [props, selectedItems]
  )

  return { menuItems, farMenuItems }
}
