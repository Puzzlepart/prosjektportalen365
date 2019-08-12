import { PageContext } from '@microsoft/sp-page-context';
import SpEntityPortalService from 'sp-entityportal-service';
import { IHubSite } from 'sp-hubsite-service';
import { IProjectPhasesWebPartProps } from "../IProjectPhasesWebPartProps";

export interface IProjectPhasesProps extends IProjectPhasesWebPartProps {
  spEntityPortalService: SpEntityPortalService;
  pageContext: PageContext;
}
