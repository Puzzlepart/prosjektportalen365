import { SpEntityPortalService } from 'sp-entityportal-service';
export interface ISPDataAdapterSettings {
    spEntityPortalService?: SpEntityPortalService;
    siteId?: string;
    webUrl?: string;
    hubSiteUrl?: string;
}
