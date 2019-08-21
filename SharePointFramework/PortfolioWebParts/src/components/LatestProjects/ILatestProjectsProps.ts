
import { IBaseComponentProps } from '../IBaseComponentProps';

export interface ILatestProjectsProps extends IBaseComponentProps {
  loadingText: string;
  emptyMessage: string;
  rowLimit: number;
}
