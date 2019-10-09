
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface ILatestProjectsProps extends IBaseComponentProps {
  /**
   * Loading text
   */
  loadingText: string;

  /**
   * Empty message
   */
  emptyMessage: string;

  /**
   * Number of items to show
   */
  rowLimit: number;
}
