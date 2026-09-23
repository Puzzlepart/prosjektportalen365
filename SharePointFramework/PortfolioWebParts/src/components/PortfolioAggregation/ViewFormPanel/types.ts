import { DataSource, IBasePanelProps } from 'pp365-shared-library'

export interface IViewFormPanel extends Pick<IBasePanelProps, 'isOpen'> {
  view?: DataSource
}
