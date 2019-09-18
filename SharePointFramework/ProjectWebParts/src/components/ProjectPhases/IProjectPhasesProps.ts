import { PageContext } from '@microsoft/sp-page-context';
import { SpEntityPortalService, ISpEntityPortalServiceParams } from 'sp-entityportal-service';


export interface IProjectPhasesProps {
  phaseField: string;
  automaticReload: boolean;
  reloadTimeout: number;
  confirmPhaseChange: boolean;
  currentPhaseViewName: boolean;
  phaseSubTextProperty: string;
  entity: ISpEntityPortalServiceParams;
  spEntityPortalService: SpEntityPortalService;
  pageContext: PageContext;
}
