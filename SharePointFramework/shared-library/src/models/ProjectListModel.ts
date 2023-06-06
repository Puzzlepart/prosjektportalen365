import { IPersonaSharedProps } from '@fluentui/react'

export class ProjectListModel {
  public siteId?: string
  public groupId?: string
  public url?: string
  public lifecycleStatus?: string
  public type?: string[]
  public serviceArea?: string[]
  public phase?: string
  public startDate?: string
  public endDate?: string
  public manager?: IPersonaSharedProps
  public owner?: IPersonaSharedProps
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
