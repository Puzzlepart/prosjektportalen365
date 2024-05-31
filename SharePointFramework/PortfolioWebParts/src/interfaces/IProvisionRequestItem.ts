export interface IProvisionRequestItem {
  Title?: string
  SpaceDisplayName?: string
  Description?: string
  BusinessJustification?: string
  SpaceType?: string
  SpaceTypeInternal?: string
  OwnersId?: any
  MembersId?: any
  ConfidentialData?: boolean
  Visibility?: string
  ExternalSharingRequired?: boolean
  Guests?: any
  SiteURL?: {
    Description?: string
    Url?: string
  }
  SiteAlias?: string
  MailboxAlias?: string
  Prefix?: string
  Suffix?: any
  TimeZoneId?: number
  LCID?: number
  JoinHub?: boolean
  HubSiteTitle?: string
  HubSite?: string
  Status?: string
  Stage?: string
  RequestKey?: string
}
