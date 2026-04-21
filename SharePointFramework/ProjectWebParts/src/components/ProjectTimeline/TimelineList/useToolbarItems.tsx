import { format } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { ItemFieldValues, ListMenuItem } from 'pp365-shared-library'
import { useContext, useMemo } from 'react'
import { ProjectTimelineContext } from '../context'
import resource from 'SharedResources'

/**
 * Returns an array of menu items for the toolbar in the ProjectTimeline component.
 *
 * New items: Sets ContentTypeId from template parameters if available.
 * Edit items: Preserves the original ContentTypeId to prevent accidental changes.
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
      resource.Lists_TimelineContent_Title
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
      selectedItems: [],
      refetch: new Date().getTime(),
      panel: null
    })
  }

  const milestoneTypeNames = useMemo(() => {
    return (
      context.state.timelineConfig
        ?.filter(
          (config) =>
            config.elementType === resource.TimelineConfiguration_Diamond_ElementType ||
            config.elementType === resource.TimelineConfiguration_Triangle_ElementType
        )
        .map((config) => config.title) || []
    )
  }, [context.state.timelineConfig])

  const fieldsWithDescriptions = useMemo(() => {
    if (!context.state.data?.fields || milestoneTypeNames.length === 0) {
      return context.state.data?.fields
    }
    return context.state.data.fields.map((field) => {
      if (field.internalName === 'GtEndDate') {
        const clone = Object.create(Object.getPrototypeOf(field), Object.getOwnPropertyDescriptors(field))
        clone.description = format(
          strings.TimelineEndDateMilestoneDescription,
          milestoneTypeNames.join(', ')
        )
        return clone
      }
      return field
    })
  }, [context.state.data?.fields, milestoneTypeNames])

  const menuItems = useMemo<ListMenuItem[]>(
    () => [
      new ListMenuItem(strings.NewItemLabel, strings.NewItemLabel).setIcon('Add').setOnClick(() => {
        const allowedTimelineTypes =
          context.state.timelineConfig?.map((config) => config.title) || []

        context.setState({
          panel: {
            headerText: strings.NewTimelineContentText,
            fields: fieldsWithDescriptions,
            allowedLookupValues: {
              GtTimelineTypeLookup: allowedTimelineTypes
            },
            submit: {
              onSubmit: async ({ properties }) => {
                const itemProperties: any = {
                  ...properties,
                  GtSiteIdLookupId: context.state.data.projectId
                }

                if (context.state.data.timelineContentTypeId) {
                  itemProperties.ContentTypeId = context.state.data.timelineContentTypeId
                }

                await SPDataAdapter.portalDataService.addItemToList(
                  'TIMELINE_CONTENT',
                  itemProperties
                )
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
          const selectedItems = context.state.selectedItems.map((id) =>
            context.state.data.listItems.find((_, idx) => idx === id)
          )

          const selectedItem = _.first(selectedItems)
          const fieldValues = new ItemFieldValues(selectedItem)
          const allowedTimelineTypes =
            context.state.timelineConfig?.map((config) => config.title) || []

          context.setState({
            panel: {
              headerText: strings.EditTimelineContentText,
              fields: fieldsWithDescriptions,
              fieldValues,
              allowedLookupValues: {
                GtTimelineTypeLookup: allowedTimelineTypes
              },
              submit: {
                onSubmit: async ({ properties }) => {
                  const updateProperties: any = {
                    ...properties
                  }

                  if (selectedItem?.ContentTypeId) {
                    updateProperties.ContentTypeId = selectedItem.ContentTypeId
                  }

                  await SPDataAdapter.portalDataService.updateItemInList(
                    'TIMELINE_CONTENT',
                    fieldValues.id,
                    updateProperties
                  )
                  dismissPanel()
                }
              }
            }
          })
        })
    ],
    [context.props, context.state.selectedItems, context.state.timelineConfig, fieldsWithDescriptions]
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
