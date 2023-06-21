import { IColumn } from '@fluentui/react'
import { sp } from '@pnp/sp'
import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import { TimelineConfigurationModel, TimelineContentModel } from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'

/**
 * Fetch timeline items and columns
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 */
export async function fetchTimelineData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationModel[]
) {
  try {
    const timelineContentList = SPDataAdapter.portal.web.lists.getByTitle(
      strings.TimelineContentListName
    )

    const projectDeliveries = (
      props.showProjectDeliveries
        ? await sp.web.lists.getByTitle(props.projectDeliveriesListName).items.getAll()
        : []
    )
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
          elementType: strings.BarLabel,
          timelineFilter: true,
          ...config
        })
      })
      .filter(Boolean)

    const defaultViewColumns = (
      await timelineContentList.defaultView.fields.select('Items').top(500).get()
    )['Items'] as string[]

    const filterString = defaultViewColumns.map((col) => `(InternalName eq '${col}')`).join(' or ')

    // eslint-disable-next-line prefer-const
    let [timelineContentItems, timelineColumns] = await Promise.all([
      timelineContentList.items
        .select(
          ...defaultViewColumns,
          'Id',
          'GtTimelineTypeLookup/Title',
          'GtSiteIdLookupId',
          'GtSiteIdLookup/Title',
          'GtSiteIdLookup/GtSiteId'
        )
        .expand('GtSiteIdLookup', 'GtTimelineTypeLookup')
        .getAll(),
      timelineContentList.fields
        .filter(filterString)
        .select('InternalName', 'Title', 'TypeAsString')
        .top(500)
        .get()
    ])

    let timelineListItems = timelineContentItems.filter(
      (item) => item.GtSiteIdLookup.Title === props.webTitle
    )

    const columns = timelineColumns
      .filter((column) => column.InternalName !== 'GtSiteIdLookup')
      .map<IColumn>((column) => ({
        key: column.InternalName,
        name: column.Title,
        fieldName: column.InternalName,
        data: { type: column.TypeAsString },
        minWidth: 150,
        maxWidth: 200,
        isResizable: true
      }))

    timelineListItems = timelineListItems.map((item) => ({
      ...item,
      EditFormUrl: [
        `${SPDataAdapter.portal.url}`,
        `/Lists/${strings.TimelineContentListName}/EditForm.aspx`,
        '?ID=',
        item.Id,
        '&Source=',
        encodeURIComponent(window.location.href)
      ].join('')
    }))

    timelineContentItems = timelineContentItems
      .filter((item) => item.GtSiteIdLookup.Title === props.webTitle)
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
      .filter((t) => t)

    timelineContentItems = [...timelineContentItems, ...projectDeliveries]

    return { timelineContentItems, timelineListItems, columns, timelineConfig } as const
  } catch (error) {
    return null
  }
}
