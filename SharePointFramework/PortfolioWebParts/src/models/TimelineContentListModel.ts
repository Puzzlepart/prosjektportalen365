export class TimelineContentListModel {
  /**
   * Creates a new instance of TimelineContentListModel
   *
   * @param siteId Site id
   * @param title Title
   * @param itemTitle Item title
   * @param type Type
   * @param sortOrder Sort order
   * @param hexColor Hexadecimal color
   * @param elementType Element type
   * @param showElementPortfolio Show element on portfolio timeline
   * @param showElementProgram Show element on program timeline
   * @param timelineFilter Timeline filterable
   * @param startDate Start Date
   * @param endDate End Date
   * @param description Description
   * @param tag Tag
   * @param budgetTotal Budget total
   * @param costsTotal Costs total
   * @param url Url
   * @param phase Phase
   */
  constructor(
    public siteId: string,
    public title: string,
    public itemTitle: string,
    public type: string,
    public sortOrder: number,
    public hexColor: string,
    public elementType: any,
    public showElementPortfolio: any,
    public showElementProgram: any,
    public timelineFilter: any,
    public startDate?: string,
    public endDate?: string,
    public description?: string,
    public tag?: string,
    public budgetTotal?: string,
    public costsTotal?: string,
    public url?: string,
    public phase?: string,
  ) {}
}
