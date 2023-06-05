import { format } from '@fluentui/react/lib/Utilities'
import { sp } from '@pnp/sp'
import sortArray from 'array-sort'
import { IAllocationSearchResult, ITimelineData, TimelineResourceType } from 'interfaces'
import _ from 'lodash'
import moment from 'moment'
import strings from 'PortfolioWebPartsStrings'
import { tryParsePercentage } from 'pp365-shared-library/lib/helpers'
import { DataSourceService } from 'pp365-shared-library/lib/services'
import { useEffect } from 'react'
import { ITimelineGroup, ITimelineItem } from '../../interfaces'
import { IResourceAllocationProps } from './types'

/**
 * Creating groups based on user property (`RefinableString71`) on the search result,
 * with fallback to role (`RefinableString72`)
 *
 * @param searchResults Search results
 *
 * @returns Timeline groups
 */
function transformGroups(searchResults: IAllocationSearchResult[]): ITimelineGroup[] {
  const groupNames = _.uniq(
    searchResults
      .map(
        (res) => res.RefinableString71 ?? (res.RefinableString72 && `${res.RefinableString72}|R`)
      )
      .filter(Boolean)
  )
  const groups = groupNames.map<ITimelineGroup>((name, index) => {
    const [title, type] = name.split('|')
    return {
      id: index,
      title,
      resourceType: type === 'R' ? TimelineResourceType.Role : TimelineResourceType.User
    }
  })
  return sortArray(groups, ['type', 'title'])
}

/**
 * Transform items
 *
 * @param searchResults Search results
 * @param groups Groups
 * @param props Component properties for `ResourceAllocation`
 *
 * @returns Timeline items
 */
function transformItems(
  searchResults: IAllocationSearchResult[],
  groups: ITimelineGroup[],
  props: IResourceAllocationProps
): ITimelineItem[] {
  const items = searchResults
    .map<ITimelineItem>((res, id) => {
      const group =
        _.find(
          groups,
          (grp) => res.RefinableString71 && res.RefinableString71.indexOf(grp.title) !== -1
        ) ??
        _.find(
          groups,
          (grp) => res.RefinableString72 && res.RefinableString72.indexOf(grp.title) !== -1
        )

      const isAbsence = res.ContentTypeId.indexOf('0x010029F45E75BA9CE340A83EFFB2927E11F4') !== -1
      if (!group || (isAbsence && !res.GtResourceAbsenceOWSCHCS)) return null
      const allocation = tryParsePercentage(res.GtResourceLoadOWSNMBR, false, 0) as number
      const itemOpacity = allocation < 30 ? 0.3 : allocation / 100
      const itemColor = allocation < 40 ? '#000' : '#fff'
      const backgroundColor = isAbsence ? props.itemAbsenceBgColor : props.itemBgColor
      const style: React.CSSProperties = {
        color: itemColor,
        border: 'none',
        cursor: 'auto',
        outline: 'none',
        background: `rgb(${backgroundColor})`,
        backgroundColor: `rgba(${backgroundColor}, ${itemOpacity})`
      }
      const title = isAbsence
        ? `${res.GtResourceAbsenceOWSCHCS} (${allocation}%)`
        : `${res.RefinableString72} - ${res.SiteTitle} (${allocation}%)`
      const start_time = moment(new Date(res.GtStartDateOWSDATE))
      const end_time = moment(new Date(res.GtEndDateOWSDATE))
      return {
        group: group.id,
        id,
        title,
        start_time,
        end_time: end_time,
        allocation,
        itemProps: { style },
        role: res.RefinableString72,
        resource: res.RefinableString71,
        props: res,
        data: {
          project: res.SiteTitle,
          projectUrl: res.SiteName
        }
      } as ITimelineItem
    })
    .filter(Boolean)
  return items
}

/**
 * Fetch data
 *
 * @param props Component properties for `ResourceAllocation`
 *
 * @returns Timeline data
 */
async function fetchData(props: IResourceAllocationProps): Promise<ITimelineData> {
  const dataSource = await new DataSourceService(sp.web).getByName(props.dataSource)
  if (!dataSource) throw format(strings.DataSourceNotFound, props.dataSource)
  try {
    const results = (
      await sp.search({
        QueryTemplate: dataSource.searchQuery,
        Querytext: '*',
        RowLimit: 500,
        TrimDuplicates: false,
        SelectProperties: props.selectProperties
      })
    ).PrimarySearchResults as IAllocationSearchResult[]
    const groups = transformGroups(results)
    const items = transformItems(results, groups, props)
    return { items, groups }
  } catch (error) {
    throw error
  }
}

/**
 * Fetch hook for `<ResourceAllocation />`
 *
 * @param props Component properties for `ResourceAllocation`
 * @param fetchCallback Fetch callback
 */
export const useResourceAllocationDataFetch = (
  props: IResourceAllocationProps,
  fetchCallback: (data: ITimelineData) => void
) => {
  useEffect(() => {
    fetchData(props).then(fetchCallback)
  }, [])
}
