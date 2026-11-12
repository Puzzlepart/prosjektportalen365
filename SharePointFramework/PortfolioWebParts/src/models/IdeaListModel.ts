/** An idea's title and source list-item ID. */
export class IdeaListModel {
  public ideaId?: string

  constructor(
    public title?: string,
    item?: any
  ) {
    this.ideaId = item.ListItemId
  }
}
