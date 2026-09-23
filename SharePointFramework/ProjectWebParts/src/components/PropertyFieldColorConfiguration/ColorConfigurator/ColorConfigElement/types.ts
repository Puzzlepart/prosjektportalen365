import { ICalloutProps, IColor } from '@fluentui/react'
import { DynamicMatrixColorScaleConfigItem } from '../../../DynamicMatrix'

export interface IColorConfigElementProps
  extends Omit<ICalloutProps, 'onChange' | 'color'> {
  /**
   * Lowest percentage this element may be dragged to.
   */
  min?: number

  /**
   * Highest percentage this element may be dragged to.
   */
  max?: number

  onChangeColor?: (ev: React.SyntheticEvent<HTMLElement, Event>, color: IColor) => void
  onChangePercentage?: (value: number, range?: [number, number], event?: MouseEvent) => void
  config: DynamicMatrixColorScaleConfigItem
}
