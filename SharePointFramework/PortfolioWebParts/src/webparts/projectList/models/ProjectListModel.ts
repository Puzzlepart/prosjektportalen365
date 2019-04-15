import { IPersonaSharedProps } from 'office-ui-fabric-react/lib/Persona';
import { ITermData, ITerm } from '@pnp/sp-taxonomy';
import { getUserPhoto } from '../../../../../@Shared/lib/helpers';
import { ISPUser } from './ISPUser';

export class ProjectListModel {
    public Id: string;
    public Title: string;
    public Url: string;
    public Manager: IPersonaSharedProps;
    public Owner: IPersonaSharedProps;
    public Phase: string;

    /**
     * Creates a new instance of ProjectListModel
     * 
     * @param {string} id Id
     * @param {string} title Title 
     * @param {string} url Url
     * @param {ISPUser} manager Manager 
     * @param {ISPUser} owner Owner
     * @param {ITermData & ITerm} phase Phase
     */
    constructor(
        id: string,
        title: string,
        url: string,
        manager?: ISPUser,
        owner?: ISPUser,
        phase?: ITermData & ITerm,
    ) {
        this.Id = id;
        this.Title = title;
        this.Url = url;
        if (manager) {
            this.Manager = { primaryText: manager.Title, imageUrl: getUserPhoto(manager.Email) };
        }
        if (owner) {
            this.Owner = { primaryText: owner.Title, imageUrl: getUserPhoto(owner.Email) };
        }
        if (phase) {
            this.Phase = phase.Name;
        }
    }
}
