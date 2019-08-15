import * as strings from 'PortfolioWebPartsStrings';


export const ProjectListColumns = [
  {
    key: 'title',
    fieldName: 'title',
    name: strings.TitleLabel,
    minWidth: 150,
  },
  {
    key: 'phase',
    fieldName: 'phase',
    name: strings.PhaseLabel,
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