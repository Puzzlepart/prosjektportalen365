import { useId } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import { SubArc } from 'react-gauge-component'
import { format } from '../../../util'
import { useFocusContentProps } from '../../../util/useFocusContentOnOpen'
import { IInstrumentColumnProps } from './types'

/**
 * Derives gauge bounds, tick ranges and accessible descriptions from measurement fields.
 */
export function useInstrumentColumn(props: IInstrumentColumnProps) {
  const startValue = props.item[props.startValueField] || props.item.GtStartValueOWSNMBR
  const endValue = props.item[props.endValueField] || props.item.GtDesiredValueOWSNMBR
  const currentValue = props.item[props.currentValueField] || props.item.LastMeasurementValue
  const unit = props.item[props.unitField] || props.item.GtMeasurementUnitOWSCHCS
  const description = props.item[props.descriptionField] || props.item.MeasurementIndicator

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

  const label = description || props.column?.name || strings.ColumnRenderOptionInstrument
  const gaugeLabel = format(
    strings.Aria.InstrumentGaugeLabel,
    currentValue ?? '',
    startValue ?? '',
    endValue ?? ''
  )
  const gaugeId = useId('instrument-gauge')
  const unitId = useId('instrument-unit')

  // It holds no control: the surface itself takes the focus as it opens, with a focus ring.
  const focusContent = useFocusContentProps()
  return {
    focusContent,
    label,
    gaugeLabel,
    gaugeId,
    unitId,
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
