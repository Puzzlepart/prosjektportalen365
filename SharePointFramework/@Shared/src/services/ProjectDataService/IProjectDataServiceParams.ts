import { LogLevel } from '@pnp/logging';
import { SPRest } from '@pnp/sp';
import { ITaxonomySession } from '@pnp/sp-taxonomy';
import { SpEntityPortalService } from 'sp-entityportal-service';

export interface IProjectDataServiceParams {    
    /**
     * Web URL
     */
    webUrl: string;
    
    /**
     * Site ID
     */
    siteId: string;
    
    /**
     * Entity service
     */
    entityService: SpEntityPortalService;
    
    /**
     * List name for project properties
     */
    propertiesListName: string;
    
    /**
     * SP rest
     */
    sp: SPRest;
    
    /**
     * Taxonomy session
     */
    taxonomy?: ITaxonomySession;
    
    /**
     * Log level
     */
    logLevel?: LogLevel;
}
