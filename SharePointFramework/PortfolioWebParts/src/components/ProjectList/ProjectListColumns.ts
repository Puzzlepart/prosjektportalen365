import * as strings from 'PortfolioWebPartsStrings'

export const PROJECTLIST_COLUMNS: any[] = [
  {
    key: 'logo',
    fieldName: 'logo',
    name: '',
    iconName: 'PictureCenter',
    isIconOnly: true,
    minWidth: 64,
    idealWidth: 64
  },
  {
    key: 'title',
    fieldName: 'title',
    name: strings.TitleLabel,
    minWidth: 120,
    idealWidth: 240
  },
  {
    key: 'phase',
    fieldName: 'phase',
    name: strings.PhaseLabel,
    minWidth: 100,
    idealWidth: 120
  },
  {
    key: 'owner',
    fieldName: 'owner',
    name: strings.ProjectOwner,
    minWidth: 120,
    idealWidth: 180
  },
  {
    key: 'manager',
    fieldName: 'manager',
    name: strings.ProjectManager,
    minWidth: 120,
    idealWidth: 180
  },
  {
    key: 'actions',
    fieldName: 'action',
    minWidth: 40,
    idealWidth: 40
  }
]
