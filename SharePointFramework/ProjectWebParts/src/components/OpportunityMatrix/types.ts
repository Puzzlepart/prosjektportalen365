import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectWebPartsStrings'
import { HTMLProps } from 'react'
import { UncertaintyElementModel } from '../../models'
import { IDynamicMatrixProps } from '../DynamicMatrix'

export interface IOpportunityMatrixProps
  extends Omit<HTMLProps<HTMLDivElement>, 'size'>,
    Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  items?: UncertaintyElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
  overrideHeaderLabels?: Record<string, boolean>
  headerLabels?: Record<string, string[]>
}

export const OPPORTUNITY_MATRIX_PROBABILITY_HEADERS = [
  strings.MatrixHeader_VerySmall,
  strings.MatrixHeader_Small,
  strings.MatrixHeader_Medium,
  strings.MatrixHeader_Large,
  strings.MatrixHeader_VeryLarge,
  strings.MatrixHeader_ExtremelyLarge
]

export const OPPORTUNITY_MATRIX_CONSEQUENCE_HEADERS = [
  strings.MatrixHeader_ExtremelyHigh,
  strings.MatrixHeader_VeryHigh,
  strings.MatrixHeader_High,
  strings.MatrixHeader_Medium,
  strings.MatrixHeader_Low,
  strings.MatrixHeader_VeryLow
]
