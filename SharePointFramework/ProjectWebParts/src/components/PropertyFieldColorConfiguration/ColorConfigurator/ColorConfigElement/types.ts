import { ICalloutProps, IColor, ISliderProps } from '@fluentui/react'
import { DynamicMatrixColorScaleConfig } from 'components/DynamicMatrix'

export interface IColorConfigElementProps
  extends Pick<ISliderProps, 'min' | 'max'>,
    Omit<ICalloutProps, 'onChange' | 'color'> {
  onChangeColor?: (ev: React.SyntheticEvent<HTMLElement, Event>, color: IColor) => void
  onChangePercentage?: (value: number, range?: [number, number], event?: MouseEvent) => void
  config: DynamicMatrixColorScaleConfig
}
