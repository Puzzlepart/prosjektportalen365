import { Web } from '@pnp/sp';
import { ProjectTemplate, IProjectTemplateSPItem } from './ProjectTemplate';

export class ProjectExtension extends ProjectTemplate {
    constructor(spItem: IProjectTemplateSPItem, web: Web) {
        super(spItem, web);
        this.key = `projectextension_${this.id}`;
    }
}
