import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectInformationProps {
  title?: string;
  entity: ISpEntityPortalServiceParams;
  hubSiteUrl: string;
  siteId: string;
  webUrl: string;
  isSiteAdmin?: boolean;
  filterField: string;
  hideActions?: boolean;
}

export const ProjectInformationDefaultProps: Partial<IProjectInformationProps> = {
  title: 'Prosjektinformasjon',
};
