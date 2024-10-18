import { Checkbox, TextField } from '@fluentui/react'
import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnDataTypePropertyField } from '../ColumnDataTypeField'
import { ColumnRenderComponent } from '../types'
import styles from './InstrumentColumn.module.scss'
import { format } from '@fluentui/react'
import { IInstrumentColumnProps } from './types'
import { useInstrumentColumn } from './useInstrumentColumn'
import {
  Link,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Text
} from '@fluentui/react-components'

/**
 * A column render component that displays a link in the cell. When the link is clicked, a dialog is displayed
 * that shows a list of items with columns. The columns can be customized using the `columns` prop. The link text can
 * be customized using the `linkText` prop. The component also supports showing an information text below the list of items
 * using the `infoTextTemplate` prop. The information text can be customized using placeholders such as `{{Title}}` and
 * `{{Count}}`. The `{{Title}}` placeholder will be replaced with the title of the column.
 *
 * @param props - The props for the component.
 * @param props.startValue - The start value of the instrument.
 * @param props.endValue - The end value of the instrument.
 * @param props.currentValue - The current value of the instrument.
 * @param props.unit - The unit of the instrument.
 * @param props.description - The description of the instrument.
 * @param props.item - The item to render.
 */
export const InstrumentColumn: ColumnRenderComponent<IInstrumentColumnProps> = (props) => {
  const { startValue, endValue, currentValue, unit, description, item } =
    useInstrumentColumn(props)
  console.log(item)

  return (
    <Popover withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Link>{format(strings.ShowInstrumentLinkText, currentValue)}</Link>
      </PopoverTrigger>
      <PopoverSurface>
        <div>
          <Text size={400}>{description}</Text>
          <Text size={400}>
            {currentValue} '-' {unit}
          </Text>
          <Text size={400}>
            {startValue} - {endValue}
          </Text>
        </div>
      </PopoverSurface>
    </Popover>
  )
}

InstrumentColumn.key = 'instrument'
InstrumentColumn.id = 'Instrument'
InstrumentColumn.displayName = strings.ColumnRenderOptionDialog
InstrumentColumn.iconName = 'SpeedHigh'
