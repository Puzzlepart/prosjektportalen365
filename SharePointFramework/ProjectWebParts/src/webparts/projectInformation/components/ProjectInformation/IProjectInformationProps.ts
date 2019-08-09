import { IProjectInformationWebPartProps } from '../../IProjectInformationWebPartProps';

export interface IProjectInformationProps extends IProjectInformationWebPartProps {
  hubSiteUrl: string;
  siteId: string;
  webUrl: string;
  isSiteAdmin?: boolean;
  filterField: string;
  hideActions?: boolean;
}
