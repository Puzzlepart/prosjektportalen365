import { SubArc } from 'react-gauge-component'
import { IInstrumentColumnProps } from './types'

/**
 * Hook that returns the necessary props for rendering an instrument column.
 *
 * @param props - The props for the instrument column.
 *
 * @returns An object containing the necessary props for rendering a popover for the instrument column.
 */
export function useInstrumentColumn(props: IInstrumentColumnProps) {
  const startValue = props.item[props.startValueField] || props.item['GtStartValueOWSNMBR']
  const endValue = props.item[props.endValueField] || props.item['GtDesiredValueOWSNMBR']
  const currentValue = props.item[props.currentValueField] || props.item['LastMeasurementValue']
  const unit = props.item[props.unitField] || props.item['GtMeasurementUnitOWSCHCS']
  const description = props.item[props.descriptionField] || props.item['MeasurementIndicator']

  let subArcs: SubArc[] = []
  let minimumValue: number
  let maximumValue: number

  if (startValue < endValue) {
    minimumValue = startValue - endValue * 0.1
    maximumValue = endValue + endValue * 0.1
    subArcs = [
      { limit: startValue - endValue * 0.1, showTick: true, color: '#FF2121' },
      { limit: startValue, showTick: true },
      { limit: startValue + (endValue - startValue) * 0.3, showTick: true },
      { limit: startValue + (endValue - startValue) * 0.7, showTick: true },
      { limit: endValue, showTick: true },
      { limit: endValue + endValue * 0.1, showTick: true }
    ]
  } else {
    maximumValue = startValue + startValue * 0.1
    minimumValue = endValue - startValue * 0.1
    subArcs = [
      { limit: endValue - startValue * 0.1, showTick: true, color: '#FF2121' },
      { limit: endValue, showTick: true },
      { limit: endValue + (startValue - endValue) * 0.3, showTick: true },
      { limit: endValue + (startValue - endValue) * 0.7, showTick: true },
      { limit: startValue, showTick: true },
      { limit: startValue + startValue * 0.1, showTick: true }
    ]
  }

  return {
    startValue,
    endValue,
    currentValue,
    unit,
    description,
    subArcs,
    minimumValue,
    maximumValue
  } as const
}
