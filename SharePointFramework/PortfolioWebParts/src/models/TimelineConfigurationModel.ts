

export class TimelineConfigurationModel {
  /**
   * Creates a new instance of TimelineConfigurationModel
   *
   * @param sortOrder Sort order
   * @param title Title
   * @param bgColorHex Background hexadecimal color
   * @param textColorHex Text hexadecimal color
   * @param timelineCategory Timeline category
   * @param elementType Element type
   * @param showElementPortfolio Show element on portfolio timeline
   * @param showElementProgram Show element on program timeline
   * @param timelineFilter Timeline filterable
   */

  constructor(
    public sortOrder: number,
    public title: string,
    public bgColorHex: string,
    public textColorHex: string,
    public timelineCategory: string,
    public elementType: any,
    public showElementPortfolio: any,
    public showElementProgram: any,
    public timelineFilter: any
  ) {}
}
