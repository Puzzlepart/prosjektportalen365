import { LogLevel } from '@pnp/logging';
import { SPRest } from '@pnp/sp';
import { ITaxonomySession } from '@pnp/sp-taxonomy';
import { SpEntityPortalService } from 'sp-entityportal-service';

export interface IProjectDataServiceParams {    
    /**
     * @todo Describe property
     */
    webUrl: string;
    
    /**
     * @todo Describe property
     */
    siteId: string;
    
    /**
     * @todo Describe property
     */
    spEntityPortalService: SpEntityPortalService;
    
    /**
     * @todo Describe property
     */
    propertiesListName: string;
    
    /**
     * @todo Describe property
     */
    sp: SPRest;
    
    /**
     * @todo Describe property
     */
    taxonomy?: ITaxonomySession;
    
    /**
     * @todo Describe property
     */
    logLevel?: LogLevel;
}
