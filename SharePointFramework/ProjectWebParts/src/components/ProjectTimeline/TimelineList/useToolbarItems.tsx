import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { ItemFieldValues, ListMenuItem } from 'pp365-shared-library'
import { useContext, useMemo } from 'react'
import { ProjectTimelineContext } from '../context'

/**
 * Returns an array of menu items for the toolbar in the PortfolioOverview component.
 *
 * @returns An array of IListMenuItem objects representing the toolbar items.
 */
export function useToolbarItems() {
  const context = useContext(ProjectTimelineContext)

  /**
   * Delete timelineitem
   *
   * @param item Item
   */
  const deleteTimelineItem = async () => {
    const list = SPDataAdapter.portalDataService.web.lists.getByTitle(
      strings.TimelineContentListName
    )

    const selectedItems = context.state.selectedItems.map((id) =>
      context.state.data.listItems.find((_, idx) => idx === id)
    )

    await selectedItems.forEach(async (item: any) => {
      await list.items.getById(item.Id).delete()
    })

    context.setState({
      selectedItems: [],
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
                await SPDataAdapter.portalDataService.addItemToList('TIMELINE_CONTENT', {
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
        .setDisabled(context.state.selectedItems.length !== 1)
        .setOnClick(() => {
          const fieldValues = new ItemFieldValues(_.first(context.state.selectedItems))
          context.setState({
            panel: {
              headerText: strings.EditTimelineContentText,
              fieldValues,
              submit: {
                onSubmit: async ({ properties }) => {
                  await SPDataAdapter.portalDataService.updateItemInList(
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
    [context.props, context.state.selectedItems]
  )

  const farMenuItems = useMemo<ListMenuItem[]>(
    () =>
      [
        new ListMenuItem(strings.DeleteItemLabel, strings.DeleteItemLabel)
          .setIcon('Delete')
          .setDisabled(context.state.selectedItems.length === 0)
          .setOnClick(() => {
            deleteTimelineItem()
          })
      ].filter(Boolean),
    [context.props, context.state.selectedItems]
  )

  return { menuItems, farMenuItems }
}
