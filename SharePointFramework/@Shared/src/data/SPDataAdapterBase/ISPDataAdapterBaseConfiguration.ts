import { LogLevel } from '@pnp/logging';

export interface ISPDataAdapterBaseConfiguration {
    siteId: string;
    webUrl: string;
    hubSiteUrl: string;
    logLevel?: LogLevel,
}
