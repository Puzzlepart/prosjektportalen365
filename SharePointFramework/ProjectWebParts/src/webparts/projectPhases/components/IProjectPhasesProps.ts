import { IProjectPhasesWebPartProps } from "../IProjectPhasesWebPartProps";
import { PageContext } from '@microsoft/sp-page-context';
import SpEntityPortalService from 'sp-entityportal-service';

export interface IProjectPhasesProps extends IProjectPhasesWebPartProps {
  spEntityPortalService: SpEntityPortalService;
  pageContext: PageContext;
}
