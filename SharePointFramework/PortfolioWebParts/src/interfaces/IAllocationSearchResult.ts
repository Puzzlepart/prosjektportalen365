import { ISearchResult } from '@pnp/sp/search'

/** Search fields used to build a resource allocation. */
export interface IAllocationSearchResult extends ISearchResult {
  RefinableString71: string
  RefinableString72: string
  GtResourceLoadOWSNMBR: string
  GtResourceAbsenceOWSCHCS: string
  GtStartDateOWSDATE: string
  GtEndDateOWSDATE: string
  GtAllocationStatusOWSCHCS: string
  GtAllocationCommentOWSMTXT: string
  SiteTitle: string
  GtResourceUserOWSUSER: string
}

/** Allocation search fields enriched with the resource's department. */
export interface IEnrichedAllocationSearchResult extends IAllocationSearchResult {
  userDepartment?: string
}
