import { Web, CamlQuery } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { IHubSite } from 'sp-hubsite-service';
import SpEntityPortalService from 'sp-entityportal-service';

/**
 * Get hub files
 * 
 * @param {IHubSite} hub Hub
 * @param {string} listName List name 
 * @param {T} model Model
 */
export async function getHubFiles<T>(hub: IHubSite, listName: string, model?: new (file: any, web: Web) => T) {
    const files = await hub.web.lists.getByTitle(listName).rootFolder.files.get();
    return model ? files.map(file => new model(file, hub.web)) : files;
}

/**
 * Get hub items
 * 
 * @param {IHubSite} hub Hub
 * @param {string} listName List name 
 * @param {T} model Model
 * @param {CamlQuery} query Query
 * @param {string[]} expands Expands
 */
export async function getHubItems<T>(hub: IHubSite, listName: string, model?: new (item: any, web: Web) => T, query?: CamlQuery, expands?: string[]) {
    let items: any[];
    if (query) {
        items = await hub.web.lists.getByTitle(listName).getItemsByCAMLQuery(query, ...expands);
    } else {
        items = await hub.web.lists.getByTitle(listName).items.get();
    }
    return model ? items.map(item => new model(item, hub.web)) : items;
}

/**
 * Get current phase
 * 
 * @param {IHubSite} hubSite Hub site
 * @param {string} termSetId Term set id
 * @param {string} siteId Site id
 */
export async function getCurrentPhase(hubSite: IHubSite, termSetId: string, siteId: string) {
    const spEntityPortalService = new SpEntityPortalService({
        webUrl: hubSite.url,
        listName: "Prosjekter",
        contentTypeId: "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
        identityFieldName: "GtSiteId"
    });
    const [phaseTerms, entityItem] = await Promise.all([
        taxonomy.getDefaultSiteCollectionTermStore().getTermSetById(termSetId).terms.select('Id', 'Name').get(),
        spEntityPortalService.getEntityItem(siteId),
    ]);
    let [currentPhase] = phaseTerms.filter(term => term.Id.indexOf(entityItem.GtProjectPhase.TermGuid) !== -1);
    if (currentPhase) {
        return currentPhase.Name;
    }
    return null;
}