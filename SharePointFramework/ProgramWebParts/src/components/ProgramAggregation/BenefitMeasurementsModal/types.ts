import { IColumn } from 'office-ui-fabric-react/lib/DetailsList'
import { IModalProps } from 'office-ui-fabric-react/lib/Modal'

export interface IItemModalProps extends IModalProps {
  title: string
  value: any
  columns?: IColumn[]
}