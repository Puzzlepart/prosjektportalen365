export class TimelineContentListModel {

  /**
   * Creates a new instance of TimelineContentListModel
   *
   * @param {string} siteId Site id
   * @param {string} title Title
   * @param {string} itemTitle Item title
   * @param {string} type Type
   * @param {string} startDate Start Date
   * @param {string} endDate End Date
   * @param {string} budgetTotal Budget total
   * @param {string} costsTotal Costs total
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
