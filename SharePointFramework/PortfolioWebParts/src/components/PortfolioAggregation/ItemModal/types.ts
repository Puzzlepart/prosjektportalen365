import { IModalProps, IColumn } from '@fluentui/react'

export interface IItemModalProps extends IModalProps {
  title: string
  value: any
  columns?: IColumn[]
}

export interface IItemModalState {
  isOpen?: boolean
}
