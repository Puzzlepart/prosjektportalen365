import { PageContext } from '@microsoft/sp-page-context'
import { SPFxContext } from '../types'

/**
 * Represents the context of a SharePoint site.
 */
export class SiteContext {
    public pageContext?: PageContext = null
    public webAbsoluteUrl?: string = null
    public webServerRelativeUrl?: string = null
    public webTitle?: string = null
    public siteId?: string = null
    public isSiteAdmin?: boolean = false

    /**
     * Creates an instance of `SiteContext`.
     * 
     * @param spfxContext SPFx context
     */
    constructor(public spfxContext?: SPFxContext) {
        this.pageContext = spfxContext.pageContext
        this.webAbsoluteUrl = this.pageContext.web.absoluteUrl
        this.webServerRelativeUrl = this.pageContext.web.serverRelativeUrl
        this.webTitle = this.pageContext.web.title
        this.siteId = this.pageContext.site.id.toString()
        this.isSiteAdmin = this.pageContext.legacyPageContext.isSiteAdmin
    }


    /**
     * Creates an instance of `SiteContext` from the provided SPFx context. Optionally, you 
     * can provide the site ID and web absolute URL.
     * 
     * @param spfxContext SPFx context
     * @param siteId Site ID (if not provided, it will be taken from the SPFx context)
     * @param webAbsoluteUrl Web absolute URL (if not provided, it will be taken from the SPFx context)
     */
    public static create(spfxContext: SPFxContext, siteId?: string, webAbsoluteUrl?: string): SiteContext {
        const siteContext = new SiteContext(spfxContext)
        if (siteId) siteContext.siteId = siteId
        if (webAbsoluteUrl) siteContext.webAbsoluteUrl = webAbsoluteUrl
        return siteContext
    }
}