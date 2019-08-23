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
    key: 'owner.text',
    fieldName: 'owner.text',
    name: strings.ProjectOwner,
    minWidth: 100,
  },
  {
    key: 'manager.text',
    fieldName: 'manager.text',
    name: strings.ProjectManager,
    minWidth: 100,
  },
];