import { TableColumnDefinition } from '@fluentui/react-components'
import { ProjectListModel } from 'pp365-shared-library'

export interface IListColumn extends TableColumnDefinition<ProjectListModel> {
  minWidth?: number
  defaultWidth?: number
}
