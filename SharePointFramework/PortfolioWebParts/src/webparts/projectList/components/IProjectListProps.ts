// import * as strings from 'ProjectListWebPartStrings';
// import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IProjectListWebPartProps } from '../IProjectListWebPartProps';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IProjectListProps extends IProjectListWebPartProps {
  siteAbsoluteUrl: string;
  hubSiteId: string;
  columns?: IColumn[];
}

export const ProjectListDefaultProps: Partial<IProjectListProps> = {
  columns: [],
  sortBy: 'Title',
};
