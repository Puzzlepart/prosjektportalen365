import { IPropertyPaneCustomFieldProps } from '@microsoft/sp-property-pane'
import { MatrixColorScaleConfig } from 'components/RiskMatrix'

export interface IPropertyFieldColorConfigurationProps extends IPropertyPaneCustomFieldProps {
  label?: string
  value?: MatrixColorScaleConfig[]
  onChange?: (targetProperty?: string, newValue?: any) => void
}
