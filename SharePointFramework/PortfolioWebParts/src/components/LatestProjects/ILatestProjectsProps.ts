
import { IBaseComponentProps } from '../';

export interface ILatestProjectsProps extends IBaseComponentProps {
  loadingText: string;
  emptyMessage: string;
  rowLimit: number;
}
