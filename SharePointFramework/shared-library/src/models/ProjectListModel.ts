import { IPersonaSharedProps } from '@fluentui/react'

export class ProjectListModel {
  /**
   * Site ID of the project site.
   */
  public siteId?: string

  /**
   * Group ID of the project site.
   */
  public groupId?: string

  /**
   * URL of the project site.
   */
  public url?: string

  /**
   * The lifecycle status of the project.
   *
   * Can be one of the following:
   * - `Aktiv`
   * - `Avsluttet`
   */
  public lifecycleStatus?: string

  /**
   * The project types. Can have multiple values.
   */
  public type?: string[]

  /**
   * The project service areas. Can have multiple values.
   */
  public serviceArea?: string[]

  /**
   * The project phase.
   */
  public phase?: string

  /**
   * Start date of the project as a string.
   */
  public startDate?: string

  /**
   * End date of the project as a string.
   */
  public endDate?: string

  /**
   * The project manager properties.
   */
  public manager?: IPersonaSharedProps

  /**
   * The project owner properties.
   */
  public owner?: IPersonaSharedProps

  /**
   * The project logo URL.
   */
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

  /**
   * The project is a parent project.
   */
  public isParent?: boolean

  /**
   * The project is a program project.
   */
  public isProgram?: boolean

  /**
   * Creates a new instance of ProjectListModel
   *
   * @param title - Title
   * @param item - Item
   */
  constructor(public title?: string, item?: any) {
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
  }
}
