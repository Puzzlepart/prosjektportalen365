import * as strings from 'ProjectListWebPartStrings';
import * as PortfolioWebPartsStrings from 'PortfolioWebPartsStrings';


export const ProjectListColumns = [
  {
    key: 'title',
    fieldName: 'title',
    name: PortfolioWebPartsStrings.TitleLabel,
    minWidth: 150,
  },
  {
    key: 'phase',
    fieldName: 'phase',
    name: PortfolioWebPartsStrings.PhaseLabel,
    minWidth: 100,
  },
  {
    key: 'owner.primaryText',
    fieldName: 'owner.primaryText',
    name: strings.ProjectOwner,
    minWidth: 100,
  },
  {
    key: 'manager.primaryText',
    fieldName: 'manager.primaryText',
    name: strings.ProjectManager,
    minWidth: 100,
  },
];