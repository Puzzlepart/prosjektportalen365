import SPDataAdapter from 'data/SPDataAdapter'
import _ from 'lodash'
import {
  EditableSPField,
  SPField,
  TimelineConfigurationModel,
  TimelineContentModel
} from 'pp365-shared-library/lib/models'
import { getClassProperties, isSystemSPField } from 'pp365-shared-library/lib/util'
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
 * Fetch timeline items and columns. When a content type is resolved (either
 * from a template-specific `timelineContentTypeId` or from the timeline
 * content list's first Item-derived CT), fields are ordered by the CT's
 * `FieldLinks` and any link with `Hidden=true` is excluded — so per-CT
 * hidden overrides hide a field from both the edit panel and the columns.
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
  // Resolve the effective content type. When no template-specific CT is
  // provided, fall back to the list's first Item-derived CT (`StringId`
  // starting with `0x0100`) so per-CT FieldLink hiding/ordering applies for
  // the default Tidslinjeinnhold deployment too.
  let effectiveContentTypeId: string | undefined = timelineContentTypeId
  if (!effectiveContentTypeId) {
    const listCts = await SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_TimelineContent_Title)
      .contentTypes.select('StringId', 'Name')
      .filter("startswith(StringId, '0x0100')")()
    effectiveContentTypeId = listCts?.[0]?.StringId
  }

  if (effectiveContentTypeId) {
    // Query via `list.contentTypes.getById(...)` — the resolved id includes
    // the list-suffix (per-list child CT), which `web.contentTypes` cannot
    // resolve.
    const listCtRef = SPDataAdapter.portalDataService.web.lists
      .getByTitle(resource.Lists_TimelineContent_Title)
      .contentTypes.getById(effectiveContentTypeId)

    const ctData = await listCtRef
      .select(
        ...getClassProperties(SPField).map((p) => `Fields/${p}`),
        'FieldLinks/Name',
        'FieldLinks/Hidden'
      )
      .expand('Fields', 'FieldLinks')<{
        Fields: SPField[]
        FieldLinks: { Name: string; Hidden: boolean }[]
      }>()

    const rawFields = (ctData.Fields ?? []).map((f) => ({
      ...f,
      ShowInEditForm: f.SchemaXml?.indexOf('ShowInEditForm="FALSE"') === -1,
      ShowInNewForm: f.SchemaXml?.indexOf('ShowInNewForm="FALSE"') === -1,
      ShowInDisplayForm: f.SchemaXml?.indexOf('ShowInDisplayForm="FALSE"') === -1
    }))
    const fieldLinks = ctData.FieldLinks ?? []

    if (fieldLinks.length > 0) {
      const fieldByName = new Map(rawFields.map((f) => [f.InternalName, f]))
      timelineContentFields = []
      for (const link of fieldLinks) {
        if (link.Hidden) continue
        const field = fieldByName.get(link.Name)
        if (field) timelineContentFields.push(field)
      }
    } else {
      timelineContentFields = rawFields
    }
  } else {
    timelineContentFields = await SPDataAdapter.portalDataService.getListFields('TIMELINE_CONTENT')
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
}
