import { ICalloutProps, IColorPickerProps } from '@fluentui/react'

export interface IColorConfigElementProps
  extends Pick<IColorPickerProps, 'onChange'>,
    Omit<ICalloutProps, 'onChange' | 'color'> {
  percentage: number
  color: [number, number, number]
}
