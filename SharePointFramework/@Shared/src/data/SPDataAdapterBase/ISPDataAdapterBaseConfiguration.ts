import { LogLevel } from '@pnp/logging';

export interface ISPDataAdapterBaseConfiguration {
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
    hubSiteUrl: string;
    
    /**
     * @todo Describe property
     */
    logLevel?: LogLevel,
}
