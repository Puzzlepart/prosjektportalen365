export class TimelineConfigurationListModel {
  /**
   * Creates a new instance of ProjectListModel
   *
   * @param sortOrder Sort order
   * @param title Title
   * @param hexColor Hexadecimal color
   * @param timelineCategory Timeline category
   * @param elementType Element type
   * @param showElementPortfolio Show element on portfolio timeline
   * @param showElementProgram Show element on program timeline
   * @param timelineFilter Timeline filterable
   */

  constructor(
    public sortOrder: number,
    public title: string,
    public hexColor: string,
    public timelineCategory: string,
    public elementType: any,
    public showElementPortfolio: any,
    public showElementProgram: any,
    public timelineFilter: any
  ) {}
}
