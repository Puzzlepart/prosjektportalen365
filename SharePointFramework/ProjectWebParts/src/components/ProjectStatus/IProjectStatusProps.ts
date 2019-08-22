import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';
import { IHubSite } from 'sp-hubsite-service';
import { PageContext } from '@microsoft/sp-page-context';
import SpEntityPortalService from 'sp-entityportal-service';

export interface IProjectStatusProps {
    title: string;
    statusReportsListName: string;
    sectionsListName: string;
    reportCtId: string;
    entity: ISpEntityPortalServiceParams;
    hubSite: IHubSite;
    spEntityPortalService: SpEntityPortalService;
    pageContext: PageContext;
}