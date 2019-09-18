import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectInformationProps {
  /**
   * @todo describe property
   */
  title?: string;

  /**
   * @todo describe property
   */
  entity: ISpEntityPortalServiceParams;

  /**
   * @todo describe property
   */
  hubSiteUrl: string;

  /**
   * @todo describe property
   */
  siteId: string;

  /**
   * @todo describe property
   */
  webUrl: string;

  /**
   * @todo describe property
   */
  isSiteAdmin?: boolean;

  /**
   * @todo describe property
   */
  filterField: string;

  /**
   * @todo describe property
   */
  hideActions?: boolean;

  /**
   * @todo describe property
   */
  boxLayout?: boolean;

  /**
   * @todo describe property
   */
  boxBackgroundColor?: string;

  /**
   * @todo describe property
   */
  boxType?: string;

  /**
   * @todo describe property
   */
  statusReportsHeader?: string;

  /**
   * @todo describe property
   */
  statusReportsCount?: number;

  /**
   * @todo describe property
   */

  /**
   * @todo describe property
   */
  statusReportsListName?: string;

  /**
   * @todo describe property
   */
  statusReportsLinkUrlTemplate?: string;
}