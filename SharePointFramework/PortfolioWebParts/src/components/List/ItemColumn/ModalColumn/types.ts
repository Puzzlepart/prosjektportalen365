import { IDetailsListProps, IModalProps } from '@fluentui/react'
import { IRenderItemColumnProps } from '../types'

export interface IModalColumnProps
  extends IModalProps,
    IRenderItemColumnProps,
    Pick<IDetailsListProps, 'columns' | 'items' | 'selectionMode'> {
  headerTitleField?: string
  headerSubTitleField?: string
  linkText?: string
  showInfoText?: boolean
  infoTextTemplate?: string
  emptyListText?: string
}
