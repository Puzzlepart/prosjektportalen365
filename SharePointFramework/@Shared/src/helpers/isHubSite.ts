import { PageContext } from '@microsoft/sp-page-context';

/**
 * Checks if the current site is a hub site
 * 
 * @param {PageContext} pageContext Page context
 */
export function isHubSite(pageContext: PageContext) {
    return pageContext.legacyPageContext.siteId.indexOf(pageContext.legacyPageContext.hubSiteId) === -1;
}