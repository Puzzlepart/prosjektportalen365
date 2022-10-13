import { IColumn } from '@fluentui/react/lib/DetailsList'
import { IModalProps } from '@fluentui/react/lib/Modal'

export interface IItemModalProps extends IModalProps {
  title: string
  value: any
  columns?: IColumn[]
}
