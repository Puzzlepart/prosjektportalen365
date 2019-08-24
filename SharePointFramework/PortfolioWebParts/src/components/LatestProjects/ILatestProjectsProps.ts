
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface ILatestProjectsProps extends IBaseComponentProps {
  /**
   * @todo describe property
   */
  loadingText: string;

  /**
   * @todo describe property
   */
  emptyMessage: string;

  /**
   * @todo describe property
   */
  rowLimit: number;
}
