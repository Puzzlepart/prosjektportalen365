import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import {
  SPField,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
import strings from 'ProjectWebPartsStrings'
import { IProjectTimelineProps } from '../types'
import '@pnp/sp/items/get-all'
import { getClassProperties } from 'pp365-shared-library'

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
    const timelineContentList = SPDataAdapter.portal.web.lists.getByTitle(
      strings.TimelineContentListName
    )
    const projectDeliveries = (
      props.showProjectDeliveries
        ? await props.sp.web.lists.getByTitle(props.projectDeliveriesListName).items.getAll()
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

    let defaultViewColumns = (
      await timelineContentList.defaultView.fields.select('Items').top(500)()
    )['Items'] as string[]

    const filterString = defaultViewColumns.map((col) => `(InternalName eq '${col}')`).join(' or ')

    const defaultColumns = await timelineContentList.fields
      .filter(filterString)
      .select(...getClassProperties(SPField))
      .top(500)<SPField[]>()

    const userFields = defaultColumns
      .filter((fld) => fld.TypeAsString.indexOf('User') === 0)
      .map((fld) => fld.InternalName)

    //remove user fields from default view columns
    defaultViewColumns = defaultViewColumns.filter((col) => userFields.indexOf(col) === -1)

    // eslint-disable-next-line prefer-const
    let [timelineContentItems, timelineColumns] = await Promise.all([
      timelineContentList.items
        .select(
          'Id',
          'GtTimelineTypeLookup/Title',
          'GtSiteIdLookupId',
          'GtSiteIdLookup/Title',
          'GtSiteIdLookup/GtSiteId',
          ...defaultViewColumns,
          ...userFields.map((fieldName) => `${fieldName}/Id`),
          ...userFields.map((fieldName) => `${fieldName}/Title`),
          ...userFields.map((fieldName) => `${fieldName}/EMail`)
        )
        .expand('GtSiteIdLookup', 'GtTimelineTypeLookup', ...userFields)
        .getAll(),
      timelineContentList.fields
        .filter(filterString)
        .select('InternalName', 'Title', 'TypeAsString')
        .top(500)()
    ])

    let timelineListItems = timelineContentItems.filter(
      (item) => item.GtSiteIdLookup.Title === props.webTitle
    )

    const columns = timelineColumns
      .filter((column) => column.InternalName !== 'GtSiteIdLookup')
      .map<any>((column) => ({
        key: column.InternalName,
        name: column.Title,
        fieldName: column.InternalName,
        data: { type: column.TypeAsString },
        minWidth: 150,
        maxWidth: 200
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
      .filter((t) => t)

    timelineContentItems = [...timelineContentItems, ...projectDeliveries]

    return { timelineContentItems, timelineListItems, columns, timelineConfig } as const
  } catch (error) {
    throw error
  }
}
