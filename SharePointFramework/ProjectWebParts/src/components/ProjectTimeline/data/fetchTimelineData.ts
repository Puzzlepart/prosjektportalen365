import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import {
  EditableSPField,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
import { IProjectTimelineProps } from '../types'
import '@pnp/sp/items/get-all'
import { IColumn } from '@fluentui/react'
import resource from 'SharedResources'

/**
 * Fetch timeline items and columns.
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
export async function fetchTimelineData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationModel[]
) {
  try {
    const timelineContentList = SPDataAdapter.portalDataService.web.lists.getByTitle(
      resource.Lists_TimelineContent_Title
    )

    let projectDeliveries = []

    try {
      projectDeliveries = props.showProjectDeliveries
        ? await props.sp.web.lists.getByTitle(props.projectDeliveriesListName).items.getAll()
        : []
    } catch (error) {}

    projectDeliveries = projectDeliveries
      .map((item) => {
        const config = _.find(timelineConfig, (col) => col.title === props.configItemTitle)
        return new TimelineContentModel(
          props.siteId,
          props.webTitle,
          item.Title,
          config?.title ?? props.configItemTitle,
          item.GtDeliveryStartTime,
          item.GtDeliveryEndTime,
          item.GtDeliveryDescription,
          item.GtTag || ''
        ).usingConfig({
          elementType: resource.TimelineConfiguration_Bar_ElementType,
          timelineFilter: true,
          ...config
        })
      })
      .filter(Boolean)

    const defaultViewColumns = (
      await timelineContentList.defaultView.fields.select('Items').top(500)()
    )['Items'] as string[]
    const timelineContentFields = await SPDataAdapter.portalDataService.getListFields(
      'TIMELINE_CONTENT'
    )
    const timelineContentEditableFields = timelineContentFields.map(
      (fld) => new EditableSPField(fld)
    )
    const defaultViewFields = timelineContentFields.filter(
      (fld) => defaultViewColumns.indexOf(fld.InternalName) > -1
    )

    const userFields = defaultViewFields
      .filter((fld) => fld.TypeAsString.indexOf('User') === 0)
      .map((fld) => fld.InternalName)

    // eslint-disable-next-line prefer-const
    let timelineContentItems = await timelineContentList.items
      .select(
        'Id',
        'GtTimelineTypeLookup/Title',
        'GtSiteIdLookupId',
        'GtSiteIdLookup/Title',
        'GtSiteIdLookup/GtSiteId',
        ...defaultViewColumns.filter((col) => userFields.indexOf(col) === -1),
        ...userFields.map((fieldName) => `${fieldName}/Id`),
        ...userFields.map((fieldName) => `${fieldName}/Title`),
        ...userFields.map((fieldName) => `${fieldName}/EMail`)
      )
      .expand('GtSiteIdLookup', 'GtTimelineTypeLookup', ...userFields)
      .getAll()

    const timelineListItems = timelineContentItems.filter(
      (item) => item.GtSiteIdLookup?.GtSiteId === props.siteId
    )

    const columns = defaultViewFields
      .filter((column) => column.InternalName !== 'GtSiteIdLookup')
      .map<IColumn>((column) => ({
        key: column.InternalName,
        name: column.Title,
        fieldName: column.InternalName,
        data: { type: column.TypeAsString },
        minWidth: 100,
        maxWidth: 200
      }))

    timelineContentItems = timelineListItems
      .filter((item) => item.GtSiteIdLookup !== null)
      .map((item) => {
        const type = item.GtTimelineTypeLookup?.Title
        const config = _.find(timelineConfig, (col) => col.title === type)
        return new TimelineContentModel(
          item.GtSiteIdLookup?.GtSiteId,
          item.GtSiteIdLookup?.Title,
          item.Title,
          config?.title,
          item.GtStartDate,
          item.GtEndDate,
          item.GtDescription,
          item.GtTag,
          item.GtBudgetTotal,
          item.GtCostsTotal
        ).usingConfig(config)
      })
      .filter(Boolean)

    timelineContentItems = [...timelineContentItems, ...projectDeliveries]

    return {
      timelineContentItems,
      timelineListItems,
      timelineContentEditableFields,
      columns,
      timelineConfig
    }
  } catch (error) {
    throw error
  }
}
