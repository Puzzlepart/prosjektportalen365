import { SpEntityPortalService } from 'sp-entityportal-service';

export interface ISPDataAdapterSettings {
    /**
     * @todo Describe property
     */
    spEntityPortalService: SpEntityPortalService;

    /**
     * @todo Describe property
     */
    siteId: string;
    
    /**
     * @todo Describe property
     */
    webUrl: string;
    
    /**
     * @todo Describe property
     */
    hubSiteUrl: string;
}
