import { ITerm, ITermData } from '@pnp/sp-taxonomy';
import { getUserPhoto } from 'shared/lib/helpers';
import { ISPUser } from 'interfaces';
import { IPersonaSharedProps } from 'office-ui-fabric-react/lib/Persona';

export class ProjectListModel {
    public manager: IPersonaSharedProps;
    public owner: IPersonaSharedProps;
    public phase: string;
    public logo: string;

    /**
     * Creates a new instance of ProjectListModel
     * 
     * @param {string} siteId Site id
     * @param {string} title Title 
     * @param {string} url Url
     * @param {ISPUser} manager Manager 
     * @param {ISPUser} owner Owner
     * @param {ITermData & ITerm} phase Phase
     */
    constructor(
        public siteId: string,
        public groupId: string,
        public title: string,
        public url: string,
        manager?: ISPUser,
        owner?: ISPUser,
        phase?: ITermData & ITerm,
    ) {
        if (manager) {
            this.manager = { text: manager.Title, imageUrl: getUserPhoto(manager.Email) };
        }
        if (owner) {
            this.owner = { text: owner.Title, imageUrl: getUserPhoto(owner.Email) };
        }
        if (phase) {
            this.phase = phase.Name;
        }
    }
}
