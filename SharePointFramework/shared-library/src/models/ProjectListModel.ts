import { AvatarProps } from '@fluentui/react-components'

/**
 * Maps a project-list item to project-card and navigation metadata.
 */
export class ProjectListModel {
  public siteId?: string

  public groupId?: string

  public url?: string

  /**
   * The lifecycle status of the project.
   *
   * Can be one of the following:
   * - `Aktiv`
   * - `Avventer`
   * - `Avsluttet`
   */
  public lifecycleStatus?: string

  public type?: string[]

  public serviceArea?: string[]

  public phase?: string

  public startDate?: string

  public endDate?: string

  public primaryUser: AvatarProps

  public secondaryUser: AvatarProps

  public logo?: string

  /**
   * User is a full member of the group, with access to all
   * group resources like Planner, Teams etc.
   */
  public isUserMember?: boolean

  /**
   * User has access to the group site, but not neccessarily
   * to all group resources like Planner, Teams etc.
   */
  public hasUserAccess?: boolean

  public data?: any[]

  public isParent?: boolean

  public isProgram?: boolean

  public template?: string

  /**
   * Template image URL from Maloppsett (used as fallback when project has no custom logo)
   */
  public templateImageUrl?: string

  constructor(
    public title?: string,
    item?: any
  ) {
    this.siteId = item.GtSiteId
    this.groupId = item.GtGroupId
    this.url = item.GtSiteUrl
    this.lifecycleStatus = item.GtProjectLifecycleStatus
    this.serviceArea = item.GtProjectServiceAreaText?.split(';') ?? []
    this.type = item.GtProjectTypeText?.split(';') ?? []
    this.phase = item.GtProjectPhaseText
    this.startDate = item.GtStartDate
    this.endDate = item.GtEndDate
    this.isParent = item.GtIsParentProject
    this.isProgram = item.GtIsProgram
    this.template = item.GtProjectTemplate
    this.templateImageUrl = item.TemplateImageUrl
    this.data = item
  }
}
