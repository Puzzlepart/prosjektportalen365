import { Web, CamlQuery } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { default as HubSiteService, IHubSite } from 'sp-hubsite-service';
import { SpEntityPortalService } from 'sp-entityportal-service';
import { PageContext } from '@microsoft/sp-page-context';
import { SPRest } from '@pnp/sp';
import { TemplateFile } from '../models';

/**
 * Get hub files
 * 
 * @param {IHubSite} hub Hub
 * @param {string} listName List name 
 * @param {T} constructor Constructor
 */
export async function getHubFiles<T>(hub: IHubSite, listName: string, constructor?: new (file: any, web: Web) => T) {
    const files = await hub.web.lists.getByTitle(listName).rootFolder.files.usingCaching().get();
    return constructor ? files.map(file => new constructor(file, hub.web)) : files;
}

/**
 * Get hub items
 * 
 * @param {IHubSite} hub Hub
 * @param {string} listName List name 
 * @param {T} constructor Constructor
 * @param {CamlQuery} query Query
 * @param {string[]} expands Expands
 */
export async function getHubItems<T>(hub: IHubSite, listName: string, constructor?: new (item: any, web: Web) => T, query?: CamlQuery, expands?: string[]) {
    try {
        let items: any[];
        if (query) {
            items = await hub.web.lists.getByTitle(listName).usingCaching().usingCaching().getItemsByCAMLQuery(query, ...expands);
        } else {
            items = await hub.web.lists.getByTitle(listName).usingCaching().items.usingCaching().get();
        }
        return constructor ? items.map(item => new constructor(item, hub.web)) : items;
    } catch (error) {
        throw error;
    }
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
        listName: 'Prosjekter',
        contentTypeId: '0x0100805E9E4FEAAB4F0EABAB2600D30DB70C',
        identityFieldName: 'GtSiteId'
    });
    const [phaseTerms, entityItem] = await Promise.all([
        taxonomy.getDefaultSiteCollectionTermStore().getTermSetById(termSetId).terms.select('Id', 'Name').get(),
        spEntityPortalService.getEntityItem(siteId),
    ]);
    if (entityItem.GtProjectPhase) {
        let [currentPhase] = phaseTerms.filter(term => term.Id.indexOf(entityItem.GtProjectPhase.TermGuid) !== -1);
        if (currentPhase) {
            return currentPhase.Name;
        }
    }
    return null;
}

/**
 * Get document templates
 * 
 * @param {SPRest} sp SP
 * @param {PageContext} pageContext Page context
 * @param {string} templateLibrary Template library
 * @param {string} phaseTermSetId Phase term set id
 */
export async function getDocumentTemplates(sp: SPRest, pageContext: PageContext, templateLibrary: string = 'Malbibliotek', phaseTermSetId = 'abcfc9d9-a263-4abb-8234-be973c46258a') {
    const hub = await HubSiteService.GetHubSite(sp, pageContext);
    const currentPhase = await getCurrentPhase(hub, phaseTermSetId, pageContext.site.id.toString());
    return await getHubItems(
        hub,
        templateLibrary,
        TemplateFile,
        {
            ViewXml: `<View><Query><Where><Or><Or><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${currentPhase}</Value></Eq><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>Flere faser</Value></Eq></Or><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>Ingen fase</Value></Eq></Or></Where></Query></View>`
        },
        ['File'],
    );
}