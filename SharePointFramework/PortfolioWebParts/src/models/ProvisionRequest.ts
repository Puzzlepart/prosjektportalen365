/* eslint-disable max-classes-per-file */

export class SPProvisionRequestItem {
  public Title?: string = ''
  public SpaceDisplayName?: string = ''
  public Description?: string = ''
  public BusinessJustification?: string = ''
  public SpaceType?: string = ''
  public SpaceTypeInternal?: string = ''
  public SiteTemplate?: string = ''
  public OwnersId?: any = []
  public MembersId?: any = []
  public Visibility?: string = 'Private'
  public ConfidentialData?: boolean = false
  public ExternalSharingRequired?: boolean = false
  public Guests?: any = []
  public SiteURL?: {
    Description?: string
    Url?: string
  }
  public SiteAlias?: string = ''
  public MailboxAlias?: string = ''
  public Prefix?: string = ''
  public Suffix?: any = []
  public TimeZoneId?: number = 4
  public LCID?: number = 1044
  public JoinHub?: boolean = true
  public HubSiteTitle?: string = ''
  public HubSite?: string = ''
  public Status?: string = 'Submitted'
  public Stage?: string = 'Submitted'
  public RequestKey?: string = ''
}

export class ProvisionRequest {
  public name: string
  public description: string
  public justification: string
  public alias: string
  public url: any
  public owner: any
  public member: any
  public isConfidential: boolean
  public privacy: string
  public externalSharing: boolean
  public guest: any
  public language: string
  public timeZone: string
  public hubSite: string

  constructor(item?: SPProvisionRequestItem) {
    this.name = item?.Title
    this.name = item?.SpaceDisplayName
    this.description = item?.Description
    this.justification = item?.BusinessJustification
    this.alias = item?.SiteAlias
  }
}
