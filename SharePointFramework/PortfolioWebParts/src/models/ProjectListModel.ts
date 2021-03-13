import { ISPUser } from 'interfaces'
import { IPersonaSharedProps } from 'office-ui-fabric-react/lib/Persona'
import { getUserPhoto } from 'pp365-shared/lib/helpers'
import * as moment from 'moment'

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
   * @param {moment.Moment} startDate Start Date
   * @param {moment.Moment} endDate End Date
   * @param {ISPUser} manager Manager
   * @param {ISPUser} owner Owner
   */
  constructor(
    public siteId: string,
    public groupId: string,
    public title: string,
    public url: string,
    public phase?: string,
    public startDate?: moment.Moment,
    public endDate?: moment.Moment,
    manager?: ISPUser,
    owner?: ISPUser
  ) {
    if (manager) this.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) }
    if (owner) this.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) }
  }
}
