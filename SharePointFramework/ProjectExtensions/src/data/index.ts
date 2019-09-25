import { PageContext } from '@microsoft/sp-page-context';
import { SPRest } from '@pnp/sp';
import { taxonomy } from '@pnp/sp-taxonomy';
import { SpEntityPortalService } from 'sp-entityportal-service';
import { default as HubSiteService, IHubSite } from 'sp-hubsite-service';
import { TemplateFile } from '../models';
import { HubConfigurationService } from 'shared/lib/services';

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
export async function getDocumentTemplates(sp: SPRest, pageContext: PageContext, templateLibrary: string = 'Malbibliotek', phaseTermSetId: string = 'abcfc9d9-a263-4abb-8234-be973c46258a') {
    const hub = await HubSiteService.GetHubSite(sp, pageContext);
    const hubConfigurationService = new HubConfigurationService(hub.web);
    const currentPhase = await getCurrentPhase(hub, phaseTermSetId, pageContext.site.id.toString());
    return await hubConfigurationService.getHubItems(
        templateLibrary,
        TemplateFile,
        {
            ViewXml: `<View><Query><Where><Or><Or><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>${currentPhase}</Value></Eq><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>Flere faser</Value></Eq></Or><Eq><FieldRef Name='GtProjectPhase' /><Value Type='Text'>Ingen fase</Value></Eq></Or></Where></Query></View>`
        },
        ['File'],
    );
}