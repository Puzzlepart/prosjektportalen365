import {
  AddFilled,
  AddRegular,
  DeleteFilled,
  DeleteRegular,
  EditFilled,
  EditRegular,
  bundleIcon
} from '@fluentui/react-icons'
import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { ItemFieldValues, ListMenuItem } from 'pp365-shared-library'
import { useContext, useMemo } from 'react'
import { ProjectTimelineContext } from '../context'

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
 * @param selectedItems An array of selected items.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems(selectedItems: any[]) {
  const context = useContext(ProjectTimelineContext)

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

    context.setState({
      refetch: new Date().getTime()
    })
  }

  /**
   * Dismisses the panel by updating the state in the context.
   */
  const dismissPanel = () => {
    context.setState({
      panel: {
        isOpen: false
      }
    })
  }

  const menuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.NewItemLabel, strings.NewItemLabel)
          .setIcon(Icons.Add)
          .setOnClick(() => {
            context.setState({
              panel: {
                ...context.state.panel,
                isOpen: true,
                headerText: strings.NewItemLabel,
                submit: {
                  onSubmit: async ({ properties }) => {
                    await SPDataAdapter.portal.addItemToList('TIMELINE_CONTENT', {
                      ...properties,
                      GtSiteIdLookupId: context.state.data.projectId
                    })
                    dismissPanel()
                  }
                },
                onDismiss: dismissPanel
              }
            })
          }),
        new ListMenuItem(strings.EditItemLabel, strings.EditItemLabel)
          .setIcon(Icons.Edit)
          .setDisabled(selectedItems.length !== 1)
          .setOnClick(() => {
            const fieldValues = new ItemFieldValues(_.first(selectedItems))
            context.setState({
              panel: {
                ...context.state.panel,
                isOpen: true,
                headerText: strings.EditItemLabel,
                fieldValues,
                submit: {
                  onSubmit: async ({ properties }) => {
                    await SPDataAdapter.portal.updateItemInList(
                      'TIMELINE_CONTENT',
                      fieldValues.id,
                      properties
                    )
                    dismissPanel()
                  }
                },
                onDismiss: dismissPanel
              }
            })
          })
      ].filter(Boolean),
    [context.props, selectedItems]
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
    [context.props, selectedItems]
  )

  return { menuItems, farMenuItems }
}
