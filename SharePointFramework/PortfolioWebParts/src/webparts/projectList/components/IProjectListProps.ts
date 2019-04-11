import * as strings from 'ProjectListWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';
import { Web } from "@pnp/sp";
import { IProjectListWebPartProps } from "../IProjectListWebPartProps";
import { IColumn } from 'office-ui-fabric-react/lib/DetailsList';

export interface IProjectListProps extends IProjectListWebPartProps {
  web: Web;
  siteAbsoluteUrl: string;
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
      fieldName: 'Owner.Title',
      name: strings.ProjectOwner,
      minWidth: 100,
    },
    {
      key: 'Manager.Title',
      fieldName: 'Manager.Title',
      name: strings.ProjectManager,
      minWidth: 100,
    },
  ],
};
