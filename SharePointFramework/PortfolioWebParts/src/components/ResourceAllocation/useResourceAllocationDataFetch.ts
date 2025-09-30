import { format } from '@fluentui/react/lib/Utilities'
import sortArray from 'array-sort'
import { IAllocationSearchResult, IEnrichedAllocationSearchResult } from 'interfaces'
import _ from 'lodash'
import moment from 'moment'
import strings from 'PortfolioWebPartsStrings'
import { tryParsePercentage } from 'pp365-shared-library/lib/util/tryParsePercentage'
import { DataSourceService } from 'pp365-shared-library/lib/services'
import { useEffect } from 'react'
import { IResourceAllocationProps } from './types'
import {
  ITimelineData,
  ITimelineGroup,
  ITimelineItem,
  TimelineGroupType
} from 'pp365-shared-library/lib/interfaces'

/**
 * Enriches search results with department information from user profiles
 * Get unique UPNs from GtResourceUserOWSUSER. Format: email | display name | ...
 * The search result source 'b09a7990-05ea-4af9-81ef-edfab16c4e31' is the generic people vertical
 *
 * @param searchResults Search results
 * @param props Component properties for `ResourceAllocation`
 *
 * @returns Enriched search results with department information
 */
const enrichWithDepartmentInfo = async (
  searchResults: IAllocationSearchResult[],
  props: IResourceAllocationProps
): Promise<IEnrichedAllocationSearchResult[]> => {
  const uniqueUPNs = _.uniq(
    searchResults
      .map((res) => {
        const val = res.GtResourceUserOWSUSER
        if (!val) return undefined
        const parts = val.split('|')
        const email = parts.length > 0 ? parts[0].trim() : val.trim()
        return email
      })
      .filter(Boolean)
  )

  if (uniqueUPNs.length === 0) {
    return searchResults.map((result) => ({ ...result, userDepartment: undefined }))
  }

  const query = uniqueUPNs.map((upn) => `UserName:"${upn.replace(/"/g, '')}"`).join(' OR ')

  let peopleResults: any[] = []
  try {
    peopleResults = (
      await props.sp.search({
        QueryTemplate: query,
        Querytext: '*',
        RowLimit: 500,
        TrimDuplicates: false,
        SelectProperties: ['UserName', 'Department', 'PreferredName', 'WorkEmail'],
        SourceId: 'b09a7990-05ea-4af9-81ef-edfab16c4e31'
      })
    ).PrimarySearchResults
  } catch (error) {
    console.warn('Failed to batch fetch people search results:', error)
  }

  const peopleMap = new Map<string, string>()
  const allUserNames = []
  for (const person of peopleResults) {
    if (person.UserName && person.Department) {
      peopleMap.set(person.UserName.toLowerCase(), person.Department)
      allUserNames.push(person.UserName.toLowerCase())
    }
  }

  return searchResults.map((result) => {
    let upn = result.GtResourceUserOWSUSER
    if (upn) {
      const parts = upn.split('|')
      upn = parts.length > 0 ? parts[0].trim().toLowerCase() : upn.trim().toLowerCase()
    } else {
      upn = undefined
    }

    return {
      ...result,
      userDepartment: upn ? peopleMap.get(upn) : undefined
    }
  })
}

/**
 * Creating groups based on user property (`RefinableString71`) on the search result,
 * with fallback to role (`RefinableString72`)
 * For user groups, append department in parentheses if available
 *
 * @param searchResults Enriched search results
 *
 * @returns Timeline groups
 */
const transformGroups = (searchResults: IEnrichedAllocationSearchResult[]): ITimelineGroup[] => {
  const groupNames = _.uniq(
    searchResults
      .map((res) => {
        if (res.RefinableString71) {
          return res.RefinableString71
        }
        if (res.RefinableString72) return `${res.RefinableString72}|R`
        return undefined
      })
      .filter(Boolean)
  )
  const groups = groupNames.map<ITimelineGroup>((name, index) => {
    const [title, type] = name.split('|')
    return {
      id: index,
      title,
      type: type === 'R' ? TimelineGroupType.Role : TimelineGroupType.User
    }
  })
  return sortArray(groups, ['type', 'title'])
}

/**
 * Transform items.
 *
 * @param searchResults Enriched search results
 * @param groups Groups
 * @param props Component properties for `ResourceAllocation`
 *
 * @returns Timeline items
 */
const transformItems = (
  searchResults: IEnrichedAllocationSearchResult[],
  groups: ITimelineGroup[],
  props: IResourceAllocationProps
): ITimelineItem[] => {
  const items = searchResults
    .map<ITimelineItem>((res, id) => {
      const resourceDisplay = res.RefinableString71
      const group =
        groups.find((grp) => grp.title === resourceDisplay) ??
        _.find(
          groups,
          (grp) => res.RefinableString72 && res.RefinableString72.indexOf(grp.title) !== -1
        )

      const isAbsence = res.ContentTypeId.indexOf('0x010029F45E75BA9CE340A83EFFB2927E11F4') !== -1
      if (!group || (isAbsence && !res.GtResourceAbsenceOWSCHCS)) return null
      const allocation = tryParsePercentage(res.GtResourceLoadOWSNMBR, false, 0) as number
      const itemOpacity = allocation < 30 ? 0.3 : allocation / 100
      const itemColor = allocation < 40 ? '#000' : '#fff'
      const backgroundColor = isAbsence ? props.itemAbsenceColor : props.itemColor
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
        itemProps: { style },
        props: res,
        data: {
          project: isAbsence ? '' : res.SiteTitle,
          projectUrl: isAbsence ? '' : res.SiteName,
          type: isAbsence ? strings.ResourceAbsenceLabel : strings.ResourceLabel,
          allocation,
          role: isAbsence ? res.GtResourceAbsenceOWSCHCS : res.RefinableString72,
          resource: resourceDisplay,
          resourceUpn: res.GtResourceUserOWSUSER
            ? res.GtResourceUserOWSUSER.split('|')[0]?.trim()
            : '',
          department: res.userDepartment || '',
          status: res.GtAllocationStatusOWSCHCS,
          comment: res.GtAllocationCommentOWSMTXT
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
const fetchData = async (props: IResourceAllocationProps): Promise<ITimelineData> => {
  const dataSource = await new DataSourceService(props.sp.web).getByName(props.dataSource)
  if (!dataSource) throw format(strings.DataSourceNotFound, props.dataSource)
  try {
    const results = (
      await props.sp.search({
        QueryTemplate: dataSource.searchQuery,
        Querytext: '*',
        RowLimit: 500,
        TrimDuplicates: false,
        SelectProperties: props.selectProperties
      })
    ).PrimarySearchResults as IAllocationSearchResult[]

    const enrichedResults = await enrichWithDepartmentInfo(results, props)

    const groups = transformGroups(enrichedResults)
    const items = transformItems(enrichedResults, groups, props)
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
