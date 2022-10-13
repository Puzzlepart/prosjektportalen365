import * as strings from 'PortfolioWebPartsStrings'
import { IColumn } from '@fluentui/react/lib/DetailsList'

export const PROJECTLIST_COLUMNS: IColumn[] = [
  {
    key: 'title',
    fieldName: 'title',
    name: strings.TitleLabel,
    minWidth: 150
  },
  {
    key: 'phase',
    fieldName: 'phase',
    name: strings.PhaseLabel,
    minWidth: 100
  },
  {
    key: 'owner.text',
    fieldName: 'owner.text',
    name: strings.ProjectOwner,
    minWidth: 100
  },
  {
    key: 'manager.text',
    fieldName: 'manager.text',
    name: strings.ProjectManager,
    minWidth: 100
  }
]
