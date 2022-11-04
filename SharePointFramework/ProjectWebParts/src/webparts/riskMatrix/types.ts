import { IBaseWebPartComponentProps } from '../../components/BaseWebPartComponent/types'
import { DynamicMatrixColorScaleConfig } from '../../components/DynamicMatrix'
import { IRiskMatrixProps } from '../../components/RiskMatrix'

export interface IRiskMatrixWebPartProps extends IBaseWebPartComponentProps, IRiskMatrixProps {
  listName?: string
  viewXml?: string
  probabilityFieldName?: string
  consequenceFieldName?: string
  probabilityPostActionFieldName?: string
  consequencePostActionFieldName?: string
}

export const RISK_MATRIX_DEFAULT_COLOR_SCALE_CONFIG: DynamicMatrixColorScaleConfig[] = [
  { percentage: 10, color: [44, 186, 0] },
  { percentage: 30, color: [163, 255, 0] },
  { percentage: 50, color: [255, 244, 0] },
  { percentage: 70, color: [255, 167, 0] },
  { percentage: 90, color: [255, 0, 0] }
]
