import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { ItemFieldValues, ListMenuItem } from 'pp365-shared-library'
import { useContext, useMemo } from 'react'
import { ProjectTimelineContext } from '../context'

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
   * Dismisses the panel by updating the state in the context,
   * and updates the `refetch` property to force a refetch of the data.
   */
  const dismissPanel = () => {
    context.setState({
      refetch: new Date().getTime(),
      panel: {
        isOpen: false
      }
    })
  }

  const menuItems = useMemo<ListMenuItem[]>(
    () => [
      new ListMenuItem(strings.NewItemLabel, strings.NewItemLabel).setIcon('Add').setOnClick(() => {
        context.setState({
          panel: {
            headerText: strings.NewTimelineContentText,
            submit: {
              onSubmit: async ({ properties }) => {
                await SPDataAdapter.portal.addItemToList('TIMELINE_CONTENT', {
                  ...properties,
                  GtSiteIdLookupId: context.state.data.projectId
                })
                dismissPanel()
              }
            }
          }
        })
      }),
      new ListMenuItem(strings.EditItemLabel, strings.EditItemLabel)
        .setIcon('Edit')
        .setDisabled(selectedItems.length !== 1)
        .setOnClick(() => {
          const fieldValues = new ItemFieldValues(_.first(selectedItems))
          context.setState({
            panel: {
              headerText: strings.EditTimelineContentText,
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
              }
            }
          })
        })
    ],
    [context.props, selectedItems]
  )

  const farMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.DeleteItemLabel, strings.DeleteItemLabel)
          .setIcon('Delete')
          .setDisabled(selectedItems.length === 0)
          .setOnClick(() => {
            deleteTimelineItem(selectedItems)
          })
      ].filter(Boolean),
    [context.props, selectedItems]
  )

  return { menuItems, farMenuItems }
}
