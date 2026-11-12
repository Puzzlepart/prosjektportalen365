import { IRenderItemColumnProps } from '../types'
import { PopoverProps } from '@fluentui/react-components'

/**
 * Maps item fields to a gauge and its descriptive popover.
 */
export interface IInstrumentColumnProps
  extends Omit<PopoverProps, 'children'>, IRenderItemColumnProps {
  startValueField?: string
  endValueField?: string
  currentValueField?: string
  unitField?: string
  descriptionField?: string
}
