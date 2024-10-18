import { IInstrumentColumnProps } from './types'
import _ from 'lodash'

/**
 * Hook that returns the necessary props for rendering an instrument column.
 *
 * @param props - The props for the instrument column.
 *
 * @returns An object containing the necessary props for rendering a popover for the instrument column.
 */
export function useInstrumentColumn(props: IInstrumentColumnProps) {
  const startValue = props.item[props.startValueField]
  const endValue = props.item[props.endValueField]
  const currentValue = props.item[props.currentValueField]
  const unit = props.item[props.unitField]
  const description = props.item[props.description]
  const item = props.item

  return {
    startValue,
    endValue,
    currentValue,
    unit,
    description,
    item
  } as const
}
