import { TypedHash } from '@pnp/common';
import { IBaseWebPartComponentProps } from '../BaseWebPartComponent';
import { ActionType } from './Actions/ActionType';

export interface IProjectInformationProps extends IBaseWebPartComponentProps {
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