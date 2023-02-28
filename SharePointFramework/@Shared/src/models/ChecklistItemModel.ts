export class ChecklistItemModel {
  public id: number
  public title: string
  public comment: string
  public status: string
  public termGuid: string

  /**
   * Constructor
   *
   * @param item Checklist SP item
   */
  constructor(item: Record<string, any>) {
    this.id = item.Id
    this.title = item.Title
    this.comment = item.GtComment
    this.status = item.GtChecklistStatus
    this.termGuid = item.GtProjectPhase && `/Guid(${item.GtProjectPhase.TermGuid})/`
  }
}
