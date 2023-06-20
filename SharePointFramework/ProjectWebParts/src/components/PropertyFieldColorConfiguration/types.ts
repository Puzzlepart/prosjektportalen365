import { IPropertyPaneCustomFieldProps } from '@microsoft/sp-property-pane'
import { DynamicMatrixColorScaleConfig } from '../DynamicMatrix'

export interface IPropertyFieldColorConfigurationProps
  extends IPropertyPaneCustomFieldProps {
  label?: string
  defaultValue?: DynamicMatrixColorScaleConfig
  value?: DynamicMatrixColorScaleConfig
  onChange?: (targetProperty?: string, newValue?: any) => void
  minColors?: number
  maxColors?: number
}
