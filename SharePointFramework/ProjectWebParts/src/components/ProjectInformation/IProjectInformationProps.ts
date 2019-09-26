import { ISpEntityPortalServiceParams } from 'sp-entityportal-service';

export interface IProjectInformationProps {
  /**
   * Title of the web part
   */
  title?: string;

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
   * Is the current user site admin
   */
  isSiteAdmin?: boolean;

  /**
   * Filter field for project properties
   */
  filterField: string;

  /**
   * Hide actions for the web part
   */
  hideActions?: boolean;

  /**
   * Header text for status reports
   */
  statusReportsHeader?: string;

  /**
   * Number of status reports to show (defaults to 0)
   */
  statusReportsCount?: number;

  /**
   * List name for status reports
   */
  statusReportsListName?: string;

  /**
   * URL template for status reports
   */
  statusReportsLinkUrlTemplate?: string;

  /**
   * Properties for the enitity residing in the hub site
   */
  entity: ISpEntityPortalServiceParams;
}