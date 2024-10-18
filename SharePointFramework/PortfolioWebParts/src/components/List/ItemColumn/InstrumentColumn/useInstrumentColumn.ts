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

  const subArcs: SubArc[] = [
    { limit: startValue - endValue * 0.1, showTick: true, color: '#FF2121' },
    { limit: startValue, showTick: true },
    { limit: startValue + (endValue - startValue) * 0.3, showTick: true },
    { limit: startValue + (endValue - startValue) * 0.7, showTick: true },
    { limit: endValue, showTick: true },
    { limit: endValue + endValue * 0.1, showTick: true }
  ]

  return {
    minimumValue: startValue - endValue * 0.1,
    maximumValue: endValue + endValue * 0.1,
    startValue,
    endValue,
    currentValue,
    unit,
    description,
    subArcs
  } as const
}
