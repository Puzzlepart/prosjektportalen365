import { WebPartContext } from '@microsoft/sp-webpart-base';
import SpEntityPortalService from 'sp-entityportal-service';
import { IHubSite } from 'sp-hubsite-service';
import { IProjectStatusWebPartProps } from '../IProjectStatusWebPartProps';

export interface IProjectStatusProps extends IProjectStatusWebPartProps {
    context: WebPartContext;
    hubSite: IHubSite;
    spEntityPortalService: SpEntityPortalService;
}
