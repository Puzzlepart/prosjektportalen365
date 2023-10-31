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
   * @param _item Checklist SP item
   */
  constructor(private _item: ChecklistSPItem) {
    this.id = _item.ID
    this.title = _item.Title
    this.comment = _item.GtComment
    this.status = _item.GtChecklistStatus
    this.termGuid = _item.GtProjectPhase?.TermGuid
  }

  /**
   * Updates the properties of the current `ChecklistItemModel` instance
   * and returns a new instance with the updated properties.
   *
   * @param properties The properties to update.
   */
  public update(properties: Partial<ChecklistItemModel>) {
    return new ChecklistItemModel({ ...this._item, ...properties })
  }
}
