import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import {
  EditableSPField,
  SPField,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
import { isSystemSPField } from 'pp365-shared-library/lib/util'
import { IProjectTimelineProps } from '../types'
import '@pnp/sp/items/get-all'
import { IColumn } from '@fluentui/react'
import resource from 'SharedResources'

// Item-list-specific extras on top of the shared `isSystemSPField` denylist.
// The Tidslinjeinnhold list disables attachments and isn't a document library,
// so these inherited base fields should never surface as columns or in the
// edit panel.
const TIMELINE_LIST_EXTRA_DENYLIST = new Set([
  'Attachments',
  'FileLeafRef',
  'FileDirRef',
  'FSObjType'
])

function isVisibleTimelineField(fld: SPField): boolean {
  if (isSystemSPField(fld)) return false
  return !TIMELINE_LIST_EXTRA_DENYLIST.has(fld.InternalName)
}

/**
 * Fetch timeline items and columns.
 *
 * When timelineContentTypeId is provided, fetches fields from that specific content type
 * and filters out hidden fields. Otherwise uses all list fields for backward compatibility.
 * Fields marked with ShowInEditForm="FALSE" or ShowInDisplayForm="FALSE" are excluded.
 *
 * @param props Component properties for `ProjectTimeline`
 * @param timelineConfig Timeline configuration
 * @param timelineContentTypeId Optional content type ID for template-specific filtering
 */
export async function fetchTimelineData(
  props: IProjectTimelineProps,
  timelineConfig: TimelineConfigurationModel[],
  timelineContentTypeId?: string
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

    let timelineContentFields: SPField[]
    if (timelineContentTypeId) {
      timelineContentFields = await SPDataAdapter.portalDataService.getContentTypeFields(
        timelineContentTypeId
      )
    } else {
      timelineContentFields = await SPDataAdapter.portalDataService.getListFields(
        'TIMELINE_CONTENT'
      )
    }
    timelineContentFields = timelineContentFields.filter(isVisibleTimelineField)

    const timelineContentEditableFields = timelineContentFields.map(
      (fld) => new EditableSPField(fld)
    )

    const defaultViewFields = timelineContentFields.filter(
      (fld) =>
        fld.InternalName !== 'GtSiteIdLookup' &&
        !fld.ReadOnlyField &&
        (fld.ShowInEditForm !== false || fld.ShowInDisplayForm !== false)
    )

    const defaultViewColumns = defaultViewFields.map((fld) => fld.InternalName)

    const userFields = defaultViewFields
      .filter((fld) => fld.TypeAsString.indexOf('User') === 0)
      .map((fld) => fld.InternalName)

    let filter = `GtSiteIdLookup/GtSiteId eq '${props.siteId}'`
    if (timelineContentTypeId) {
      filter = `${filter} and (startswith(ContentTypeId, '${timelineContentTypeId}'))`
    }

    // eslint-disable-next-line prefer-const
    let timelineContentItems = await timelineContentList.items
      .select(
        'Id',
        'ContentTypeId',
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
      .filter(filter)
      .getAll()

    const timelineListItems = timelineContentItems

    const columns: IColumn[] = defaultViewColumns
      .filter((columnName) => columnName !== 'GtSiteIdLookup')
      .map((columnName) => {
        const column = defaultViewFields.find((fld) => fld.InternalName === columnName)
        return column
          ? {
              key: column.InternalName,
              name: column.Title,
              fieldName: column.InternalName,
              data: { type: column.TypeAsString },
              minWidth: 100,
              maxWidth: 200
            }
          : null
      })
      .filter(Boolean)

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
