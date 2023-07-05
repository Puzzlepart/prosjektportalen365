import { IDetailsListProps, IModalProps } from '@fluentui/react'
import { IRenderItemColumnProps } from '../types'

export interface IModalColumnProps
  extends IModalProps,
  IRenderItemColumnProps,
  Pick<IDetailsListProps, 'columns' | 'items' | 'selectionMode'> {
  headerText: string
  linkText: string
}