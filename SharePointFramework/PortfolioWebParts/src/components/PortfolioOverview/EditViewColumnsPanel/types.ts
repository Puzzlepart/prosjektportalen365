import { IPanelProps } from '@fluentui/react'
import { ProjectColumn } from 'pp365-shared-library'

export interface IEditViewColumnsPanel extends Pick<IPanelProps, 'isOpen'> {
  columns?: ProjectColumn[]
  revertColumnOrder?: boolean
}
