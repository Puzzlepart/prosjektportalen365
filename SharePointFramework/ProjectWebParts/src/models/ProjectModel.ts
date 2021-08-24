export class ProjectModel {
  /**
   * Creates a new instance of ProjectModel
   *
   * @param {string} siteId Site id
   * @param {string} title Title
   * @param {string} url Url
   * @param {string} phase Phase
   * @param {string} startDate Start date
   * @param {string} endDate End date
   * @param {string} budgetTotal Budget total
   * @param {string} costsTotal Costs total
   * @param {string} type Type
   */
  constructor(
    public siteId: string,
    public groupId: string,
    public title: string,
    public url: string,
    public phase?: string,
    public startDate?: string,
    public endDate?: string,
    public budgetTotal?: string,
    public costsTotal?: string,
    public type?: string
  ) {}
}
