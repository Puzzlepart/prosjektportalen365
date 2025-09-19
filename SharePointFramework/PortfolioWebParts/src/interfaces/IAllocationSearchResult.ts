import { ISearchResult } from '@pnp/sp/search'


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
  GtResourceUserOWSUSER: string // UPN or Name|UPN
}

export interface IEnrichedAllocationSearchResult extends IAllocationSearchResult {
  userDepartment?: string
}
