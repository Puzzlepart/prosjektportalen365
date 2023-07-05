import { IPanelProps } from '@fluentui/react'
import { ProjectContentColumn } from 'pp365-shared-library'

export interface IColumnFormPanel extends Pick<IPanelProps, 'isOpen'> {
  column?: ProjectContentColumn
}
