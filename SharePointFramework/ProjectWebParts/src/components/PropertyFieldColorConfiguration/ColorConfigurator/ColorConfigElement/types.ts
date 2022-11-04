import { ICalloutProps, IColorPickerProps } from '@fluentui/react'
import { DynamicMatrixColorScaleConfig } from 'components/DynamicMatrix'

export interface IColorConfigElementProps
  extends Pick<IColorPickerProps, 'onChange'>,
    Omit<ICalloutProps, 'onChange' | 'color'> {
  config: DynamicMatrixColorScaleConfig
}
