import { IPanelProps } from '@fluentui/react'
import { DataSource } from 'pp365-shared-library'

export interface IViewFormPanel extends Pick<IPanelProps, 'isOpen'> {
  view?: DataSource
}
