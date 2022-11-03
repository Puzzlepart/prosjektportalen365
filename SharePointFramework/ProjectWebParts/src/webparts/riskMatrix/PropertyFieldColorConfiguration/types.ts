import { IPropertyPaneCustomFieldProps } from '@microsoft/sp-property-pane'
import { ColorScaleConfig } from 'components/RiskMatrix'

export interface IPropertyFieldColorConfigurationProps extends IPropertyPaneCustomFieldProps {
    label?: string
    value?: ColorScaleConfig[]
    onChange?: (targetProperty?: string, newValue?: any) => void
}
