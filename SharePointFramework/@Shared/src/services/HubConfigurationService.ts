import { Web } from '@pnp/sp';
import { SPProjectColumnConfigItem, SPProjectColumnItem, ProjectColumnConfig } from '../models';

export class HubConfigurationService {
    private web: Web;

    constructor(urlOrWeb: string | Web) {
        if (typeof urlOrWeb === 'string') {
            this.web = new Web(urlOrWeb);
        } else {
            this.web = urlOrWeb;
        }
    }

    /**
     * Get project columns
     */
    public getProjectColumns(): Promise<SPProjectColumnItem[]> {
        return this.web.lists.getByTitle('Prosjektkolonner')
            .items
            .select(...Object.keys(new SPProjectColumnItem()))
            .get<SPProjectColumnItem[]>();
    }

    /**
     * Get project column configuration
     */
    public async getProjectColumnConfig(): Promise<ProjectColumnConfig[]> {
        let spItems = await this.web.lists.getByTitle('Prosjektkolonnekonfigurasjon').items
            .orderBy('ID', true)
            .expand('GtPortfolioColumn')
            .select(...Object.keys(new SPProjectColumnConfigItem()), 'GtPortfolioColumn/Title', 'GtPortfolioColumn/GtInternalName')
            .get<SPProjectColumnConfigItem[]>();
        return spItems.map(c => new ProjectColumnConfig(c));;
    }
}