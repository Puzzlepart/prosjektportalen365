import { IColorPickerProps } from '@fluentui/react'

export interface IColorConfigElementProps extends Pick<IColorPickerProps, 'onChange'> {
  percentage: number
  color: string
}
