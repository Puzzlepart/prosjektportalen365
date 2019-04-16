import { IProjectStatusWebPartProps } from '../IProjectStatusWebPartProps';
import { IHubSite } from 'sp-hubsite-service';
import { PageContext } from '@microsoft/sp-page-context';
import SpEntityPortalService from 'sp-entityportal-service';

export interface IProjectStatusProps extends IProjectStatusWebPartProps {
    hubSite: IHubSite;
    spEntityPortalService: SpEntityPortalService;
    pageContext: PageContext;
}
