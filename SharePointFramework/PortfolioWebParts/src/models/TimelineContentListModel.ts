export class TimelineContentListModel {
  /**
   * Creates a new instance of TimelineContentListModel
   *
   * @param siteId Site id
   * @param title Title
   * @param itemTitle Item title
   * @param type Type
   * @param startDate Start Date
   * @param endDate End Date
   * @param budgetTotal Budget total
   * @param costsTotal Costs total
   */
  constructor(
    public siteId: string,
    public title: string,
    public itemTitle: string,
    public type: string,
    public startDate?: string,
    public endDate?: string,
    public budgetTotal?: string,
    public costsTotal?: string
  ) {}
}
