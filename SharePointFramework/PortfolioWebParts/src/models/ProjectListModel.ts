import { ISPUser } from 'interfaces'
import { IPersonaSharedProps } from 'office-ui-fabric-react/lib/Persona'
import { getUserPhoto } from 'pp365-shared/lib/helpers'

export class ProjectListModel {
  public manager: IPersonaSharedProps
  public owner: IPersonaSharedProps
  public logo: string

  /**
   * Creates a new instance of ProjectListModel
   *
   * @param {string} siteId Site id
   * @param {string} title Title
   * @param {string} url Url
   * @param {string} phase Phase
   * @param {string} startDate Start date
   * @param {string} endDate End date
   * @param {ISPUser} manager Manager
   * @param {ISPUser} owner Owner
   * @param {string} budgetTotal Budget total
   * @param {string} costsTotal Costs total
   * @param {string} type Type
   * @param {boolean} boolean ReadOnly
   */
  constructor(
    public siteId: string,
    public groupId: string,
    public title: string,
    public url: string,
    public phase?: string,
    public startDate?: string,
    public endDate?: string,
    manager?: ISPUser,
    owner?: ISPUser,
    public readOnly?: boolean,
    public budgetTotal?: string,
    public costsTotal?: string,
    public type?: string
  ) {
    if (manager) this.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
    if (owner) this.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
  }
}
