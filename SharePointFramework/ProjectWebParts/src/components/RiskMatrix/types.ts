import { PageContext } from '@microsoft/sp-page-context'
import { HTMLProps } from 'react'
import { UncertaintyElementModel } from '../../types'
import { IDynamicMatrixProps } from '../DynamicMatrix'

export interface IRiskMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  customConfigUrl?: string
  items?: UncertaintyElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
  overrideHeaderLabels?: Record<string, boolean>
  headerLabels?: Record<string, string[]>
}
