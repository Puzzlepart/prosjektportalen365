import { Web } from '@pnp/sp';
import { IProjectPhasesWebPartProps } from "../IProjectPhasesWebPartProps";
import { WebPartContext } from '@microsoft/sp-webpart-base';
import SpEntityPortalService from 'sp-entityportal-service';
import { IHubSite } from 'sp-hubsite-service';

export interface IProjectPhasesProps extends IProjectPhasesWebPartProps {
  currentUserManageWeb: boolean;
  webAbsoluteUrl: string;
  domElement: HTMLElement;
  web: Web;
  context: WebPartContext;
  hubSite: IHubSite;
  spEntityPortalService: SpEntityPortalService;
}
