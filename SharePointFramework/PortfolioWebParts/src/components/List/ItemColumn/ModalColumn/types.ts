import { IDetailsListProps, IModalProps } from '@fluentui/react'
import { IRenderItemColumnProps } from '../types'

interface IIModalColumnHeaderProps {
  /**
   * Title of the modal header
   */
  title: string

  /**
   * Subtitle of the modal header
   */
  subTitle?: string
}

export interface IModalColumnProps
  extends IModalProps,
    IRenderItemColumnProps,
    Pick<IDetailsListProps, 'columns' | 'items' | 'selectionMode'> {
  header?: IIModalColumnHeaderProps
  linkText?: string
  showInfoText?: boolean
  infoTextTemplate?: string
}
