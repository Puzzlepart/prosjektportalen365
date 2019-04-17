import { IProjectListWebPartProps } from '../IProjectListWebPartProps';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { ProjectListColumns } from './ProjectListColumns';

export interface IProjectListProps extends IProjectListWebPartProps {
  siteAbsoluteUrl: string;
  columns?: IColumn[];
}

export const ProjectListDefaultProps: Partial<IProjectListProps> = {
  columns: ProjectListColumns,
  sortBy: 'Title',
};
