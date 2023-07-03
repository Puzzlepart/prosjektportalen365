import { IPanelProps } from '@fluentui/react'
import { ProjectColumn } from 'pp365-shared-library'

export interface IColumnFormPanel extends Pick<IPanelProps, 'isOpen'> {
  column?: ProjectColumn
}
