import { IBasePanelProps, ProjectContentColumn } from 'pp365-shared-library'

export interface IColumnFormPanel extends Pick<IBasePanelProps, 'isOpen'> {
  column?: ProjectContentColumn
}
