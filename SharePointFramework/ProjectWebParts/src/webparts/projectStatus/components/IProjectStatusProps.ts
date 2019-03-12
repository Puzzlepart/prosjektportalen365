import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IProjectStatusWebPartProps } from '../ProjectStatusWebPart';
import SpEntityPortalService from 'sp-entityportal-service';
import { IHubSite } from 'sp-hubsite-service';

export interface IProjectStatusProps extends IProjectStatusWebPartProps {
    context: WebPartContext;
    hubSite: IHubSite;
    spEntityPortalService: SpEntityPortalService;
}
