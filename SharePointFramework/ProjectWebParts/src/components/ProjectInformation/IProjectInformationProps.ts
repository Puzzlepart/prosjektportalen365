import { DisplayMode } from '@microsoft/sp-core-library';
import { TypedHash } from '@pnp/common';
import { IHubSite } from 'sp-hubsite-service';
import { ActionType } from './Actions/ActionType';

export interface IProjectInformationProps {
  /**
   * Title of the web part
   */
  title?: string;

  /**
   * Hub site
   */
  hubSite: IHubSite;

  /**
   * ID of the site
   */
  siteId: string;

  /**
   * URL for the web
   */
  webUrl: string;

  /**
   * Title for the web
   */
  webTitle?: string;

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
   * Display mode
   */
  displayMode?: DisplayMode;

  /**
   * @todo Describe property
   */
  onFieldExternalChanged?: (fieldName: string, checked: boolean) => void;

  /**
   * @todo Describe property
   */
  showFieldExternal?: TypedHash<boolean>;

  /**
   * @todo Describe property
   */
  customActions?: ActionType[];
}