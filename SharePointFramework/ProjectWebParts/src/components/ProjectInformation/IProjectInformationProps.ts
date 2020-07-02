import { TypedHash } from '@pnp/common'
import { IBaseWebPartComponentProps } from '../BaseWebPartComponent'
import { ActionType } from './Actions/ActionType'

export interface IProjectInformationProps extends IBaseWebPartComponentProps {
  /**
   * Page
   */
  page: 'Frontpage' | 'ProjectStatus' | 'Portfolio';

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
   * On field external changed
   */
  onFieldExternalChanged?: (fieldName: string, checked: boolean) => void;

  /**
   * A hash object of fields to show for external users
   */
  showFieldExternal?: TypedHash<boolean>;

  /**
   * Skip sync to hub
   */
  skipSyncToHub?: boolean;

  /**
   * Custom actions/button to add
   */
  customActions?: ActionType[];
}