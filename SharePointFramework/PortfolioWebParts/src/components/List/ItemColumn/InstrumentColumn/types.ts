import { IRenderItemColumnProps } from '../types'
import { PopoverProps } from '@fluentui/react-components'

export interface IInstrumentColumnProps extends Omit<PopoverProps, 'children'>, IRenderItemColumnProps {
  startValueField?: string
  endValueField?: string
  currentValueField?: string
  unitField?: string
  description?: string
}

// { "startValueField": "GtStartValue", "endValueField": "GtDesiredValue", "currentValueField": "GtMeasurementValue", "unitField": "GtMeasurementUnit", "description": "This is a description" }
