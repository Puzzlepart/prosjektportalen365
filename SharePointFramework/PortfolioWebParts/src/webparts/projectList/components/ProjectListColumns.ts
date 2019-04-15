import * as strings from 'ProjectListWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';


export const ProjectListColumns = [
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
];