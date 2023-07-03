import { IPanelProps } from '@fluentui/react'

export interface IColumnFormPanelProps extends Pick<IPanelProps, 'isOpen' | 'onDismiss'> {
  column?: Map<string, any>
}
