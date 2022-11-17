import { DynamicMatrixColorScaleConfig } from '../../DynamicMatrix'
import { IPropertyFieldColorConfigurationProps } from '../types'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IColorConfiguratorProps extends IPropertyFieldColorConfigurationProps {}

export interface IColorConfiguratorState {
  config: DynamicMatrixColorScaleConfig
}
