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
   * @param {string} startDate Start Date
   * @param {string} endDate End Date
   * @param {ISPUser} manager Manager
   * @param {ISPUser} owner Owner
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
    public budgetTotal?: string,
    public costsTotal?: string
  ) {
    if (manager) this.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
    if (owner) this.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
  }
}
