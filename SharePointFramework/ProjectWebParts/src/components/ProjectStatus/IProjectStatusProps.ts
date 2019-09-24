import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectStatusProps {
    /**
     * @todo describe property
     */
    title: string;

    /**
     * Web part context
     */
    context: WebPartContext;

    /**
     * URL for the hub site
     */
    hubSiteUrl: string;

    /**
     * ID of the site
     */
    siteId: string;

    /**
     * URL for the web
     */
    webUrl: string;

    /**
     * @todo describe property
     */
    reportListName: string;

    /**
     * @todo describe property
     */
    sectionsListName: string;

    /**
     * @todo describe property
     */
    reportCtId: string;

    /**
     * @todo describe property
     */
    entity: ISpEntityPortalServiceParams;
}
