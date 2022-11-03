import { IPropertyPaneCustomFieldProps } from '@microsoft/sp-property-pane'
import { DynamicMatrixColorScaleConfig } from '../../../components/DynamicMatrix'

export interface IPropertyFieldColorConfigurationProps extends IPropertyPaneCustomFieldProps {
  label?: string
  value?: DynamicMatrixColorScaleConfig[]
  onChange?: (targetProperty?: string, newValue?: any) => void
  minColors?: number
  maxColors?: number
}
