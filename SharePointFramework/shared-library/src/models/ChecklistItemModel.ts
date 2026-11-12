/**
 * Represents a SharePoint phase-checklist item.
 */
export class ChecklistSPItem {
  public ID: number = 0
  public Title: string = ''
  public GtComment: string = ''
  public GtChecklistStatus: string = ''
  public GtProjectPhase: {
    TermGuid?: string
  } = {}
}

/**
 * Exposes checklist text, status and phase identity from a SharePoint item.
 */
export class ChecklistItemModel {
  public id: number
  public title: string
  public comment: string
  public status: string
  public termGuid: string

  constructor(private _item: ChecklistSPItem) {
    this.id = _item.ID
    this.title = _item.Title
    this.comment = _item.GtComment
    this.status = _item.GtChecklistStatus
    this.termGuid = _item.GtProjectPhase?.TermGuid
  }

  /**
   * Creates a new model from the original SharePoint item merged with the supplied properties.
   */
  public update(properties: Partial<ChecklistItemModel>) {
    return new ChecklistItemModel({ ...this._item, ...properties })
  }
}
