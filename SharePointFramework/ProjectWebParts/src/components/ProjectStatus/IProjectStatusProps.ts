import { IHubSite } from 'sp-hubsite-service';
import { PageContext } from '@microsoft/sp-page-context';
import SpEntityPortalService, { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectStatusProps {    
    /**
     * @todo describe property
     */
    title: string;
    
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
    
    /**
     * @todo describe property
     */
    hubSite: IHubSite;
    
    /**
     * @todo describe property
     */
    spEntityPortalService: SpEntityPortalService;
    
    /**
     * @todo describe property
     */
    pageContext: PageContext;
}
