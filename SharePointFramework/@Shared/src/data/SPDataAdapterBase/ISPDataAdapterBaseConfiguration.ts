import { LogLevel } from '@pnp/logging';

export interface ISPDataAdapterBaseConfiguration {
   /**
     * Web URL
     */
    webUrl: string;
    
    /**
     * Site ID
     */
    siteId: string;    
    
    /**
     * Hub site URL
     */
    hubSiteUrl: string;
    
    /**
     * Log level
     */
    logLevel?: LogLevel,
}
