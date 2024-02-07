export class SPProjectItem {
  public GtGroupId: string = '00000000-0000-0000-0000-000000000000'
  public GtSiteId: string = '00000000-0000-0000-0000-000000000000'
  public GtSiteUrl: string = 'https://'
  public GtProjectPhaseText: string = ''
  public GtProjectTypeText: string[] = []
  public GtProjectServiceAreaText: string[] = []
  public GtProjectLifecycleStatus: string = ''
  public GtStartDate: string = ''
  public GtEndDate: string = ''
  public GtProjectOwnerId: number = -1
  public GtProjectManagerId: number = -1
  public Title?: string = ''
  public Id?: number = -1
  public GtIsProgram?: boolean = false
  public GtIsParentProject?: boolean = false
  public GtProjectTemplate?: string = ''
}
