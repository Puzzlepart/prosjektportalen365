import { PageContext } from '@microsoft/sp-page-context';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { ISpEntityPortalServiceParams, SpEntityPortalService } from 'sp-entityportal-service';


export interface IProjectPhasesProps {
  /**
   * Web part context
   */
  context: WebPartContext;

  /**
   * Field name for phase field
   */
  phaseField: string;

  /**
   * Automatic reload after phase change
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
   * Reload timeout
   */
  reloadTimeout: number;

  /**
   * Should phase change be confirmed
   */
  confirmPhaseChange: boolean;

  /**
   * View name for current phase
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
}
