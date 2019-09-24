import { PageContext } from '@microsoft/sp-page-context';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ISpEntityPortalServiceParams, SpEntityPortalService } from 'sp-entityportal-service';


export interface IProjectPhasesProps {
  /**
   * Web part context
   */
  context: WebPartContext;

  /**
   * @todo Describe property
   */
  phaseField: string;

  /**
   * @todo Describe property
   */
  automaticReload: boolean;

  /**
   * URL for the hub site
   */
  hubSiteUrl: string;

  /**
   * ID of the site
   */
  siteId: string;

  /**
   * URL for the web
   */
  webUrl: string;

  /**
   * @todo Describe property
   */
  reloadTimeout: number;

  /**
   * @todo Describe property
   */
  confirmPhaseChange: boolean;

  /**
   * @todo Describe property
   */
  currentPhaseViewName: boolean;

  /**
   * @todo Describe property
   */
  phaseSubTextProperty: string;

  /**
   * @todo Describe property
   */
  entity: ISpEntityPortalServiceParams;

  /**
   * @todo Describe property
   */
  spEntityPortalService: SpEntityPortalService;

  /**
   * @todo Describe property
   */
  pageContext: PageContext;
}
