import { DynamicMatrixColorScaleConfig } from '../../DynamicMatrix'
import { IPropertyFieldColorConfigurationProps } from '../types'

export interface IColorConfiguratorProps extends IPropertyFieldColorConfigurationProps {}

export interface IColorConfiguratorState {
  config: DynamicMatrixColorScaleConfig
}
