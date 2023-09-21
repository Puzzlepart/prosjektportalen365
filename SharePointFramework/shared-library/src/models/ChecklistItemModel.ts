export class ChecklistSPItem {
  public ID: number = 0
  public Title: string = ''
  public GtComment: string = ''
  public GtChecklistStatus: string = ''
  public GtProjectPhase: {
    TermGuid?: string
  } = {}
}

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
  constructor(item: ChecklistSPItem) {
    this.id = item.ID
    this.title = item.Title
    this.comment = item.GtComment
    this.status = item.GtChecklistStatus
    this.termGuid = item.GtProjectPhase?.TermGuid
  }
}
