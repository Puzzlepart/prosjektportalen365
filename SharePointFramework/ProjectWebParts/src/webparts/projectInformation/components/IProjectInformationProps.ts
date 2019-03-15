import { WebPartContext } from '@microsoft/sp-webpart-base';
import { IProjectInformationWebPartProps } from '../IProjectInformationWebPartProps';
import { IHubSite } from 'sp-hubsite-service';

export interface IProjectInformationProps extends IProjectInformationWebPartProps {
  hubSiteUrl?: string;
  hubSite?: IHubSite;
  context?: WebPartContext;
  siteId?: string;
  webUrl?: string;
  isSiteAdmin?: boolean;
  filterField: string;
  updateTitle?: (title: string) => void;
  hideEditPropertiesButton?: boolean;
}
