import * as strings from 'ProjectListWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { IProjectListWebPartProps } from '../IProjectListWebPartProps';
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IProjectListProps extends IProjectListWebPartProps {
  siteAbsoluteUrl: string;
  hubSiteId: string;
  columns?: IColumn[];
}

export const ProjectListDefaultProps: Partial<IProjectListProps> = {
  columns: [
    {
      key: 'Title',
      fieldName: 'Title',
      name: PortfolioWebPartsStrings.TitleLabel,
      minWidth: 150,
    },
    {
      key: 'Phase',
      fieldName: 'Phase',
      name: PortfolioWebPartsStrings.PhaseLabel,
      minWidth: 100,
    },
    {
      key: 'Owner.Title',
      fieldName: 'Owner.primaryText',
      name: strings.ProjectOwner,
      minWidth: 100,
    },
    {
      key: 'Manager.Title',
      fieldName: 'Manager.primaryText',
      name: strings.ProjectManager,
      minWidth: 100,
    },
  ],
  sortBy: 'Title',
};
