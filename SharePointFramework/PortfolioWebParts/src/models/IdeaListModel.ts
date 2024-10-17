export class IdeaListModel {
  public ideaId?: string

  /**
   * Creates a new instance of IdeaListModel
   *
   * @param title - Title
   * @param item - Item
   */
  constructor(public title?: string, item?: any) {
    this.ideaId = item.ListItemId
  }
}
