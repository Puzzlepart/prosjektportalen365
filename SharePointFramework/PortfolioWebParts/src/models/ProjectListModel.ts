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
   * @param siteId Site id
   * @param title Title
   * @param url Url
   * @param phase Phase
   * @param startDate Start date
   * @param endDate End date
   * @param manager Manager
   * @param owner Owner
   * @param userIsMember User is member
   * @param budgetTotal Budget total
   * @param costsTotal Costs total
   * @param type Type
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
    public userIsMember?: boolean,
    public budgetTotal?: string,
    public costsTotal?: string,
    public type?: string,
    public isParent?: boolean,
    public isProgram?: boolean
  ) {
    if (manager) this.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
    if (owner) this.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
  }
}
