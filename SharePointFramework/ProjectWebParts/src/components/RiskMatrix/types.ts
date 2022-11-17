import { PageContext } from '@microsoft/sp-page-context'
import strings from 'ProjectWebPartsStrings'
import { IBaseWebPartComponentProps } from '../../components/BaseWebPartComponent/types'
import { UncertaintyElementModel } from '../../models'
import { IDynamicMatrixProps } from '../DynamicMatrix'

export interface IRiskMatrixProps
  extends IBaseWebPartComponentProps,
    Pick<IDynamicMatrixProps, 'size' | 'colorScaleConfig' | 'calloutTemplate'> {
  customConfigUrl?: string
  items?: UncertaintyElementModel[]
  fullWidth?: boolean
  pageContext?: PageContext
  overrideHeaderLabels?: Record<string, boolean>
  headerLabels?: Record<string, string[]>
}

export const RISK_MATRIX_PROBABILITY_HEADERS: string[] = [
  strings.MatrixHeader_VeryHigh,
  strings.MatrixHeader_High,
  strings.MatrixHeader_Medium,
  strings.MatrixHeader_Low,
  strings.MatrixHeader_VeryLow,
  strings.MatrixHeader_ExtremelyLow
]

export const RISK_MATRIX_CONSEQUENCE_HEADERS: string[] = [
  strings.MatrixHeader_Insignificant,
  strings.MatrixHeader_Small,
  strings.MatrixHeader_Moderate,
  strings.MatrixHeader_Serious,
  strings.MatrixHeader_Critical,
  strings.MatrixHeader_VeryCritical
]
