import strings from 'PortfolioWebPartsStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import styles from './InstrumentColumn.module.scss'
import { format } from '@fluentui/react'
import { IInstrumentColumnProps } from './types'
import { useInstrumentColumn } from './useInstrumentColumn'
import { Link, Popover, PopoverSurface, PopoverTrigger, Text } from '@fluentui/react-components'
import GaugeComponent from 'react-gauge-component'

/**
 * A column render component that displays a link in the cell. When the link is clicked, a dialog is displayed
 * that shows a list of items with columns. The columns can be customized using the `columns` prop. The link text can
 * be customized using the `linkText` prop. The component also supports showing an information text below the list of items
 * using the `infoTextTemplate` prop. The information text can be customized using placeholders such as `{{Title}}` and
 * `{{Count}}`. The `{{Title}}` placeholder will be replaced with the title of the column.
 *
 * @param props - The props for the component.
 * @param props.currentValue - The current value of the instrument.
 * @param props.unit - The unit of the instrument.
 * @param props.description - The description of the instrument.
 * @param props.subArcs - The sub arcs of the instrument.
 * @param props.minimumValue - The minimum value of the instrument.
 * @param props.maximumValue - The maximum value of the instrument.
 * @param props.item - The item to render.
 */
export const InstrumentColumn: ColumnRenderComponent<IInstrumentColumnProps> = (props) => {
  const {
    startValue,
    endValue,
    currentValue,
    unit,
    description,
    subArcs,
    minimumValue,
    maximumValue
  } = useInstrumentColumn(props)

  return (
    <Popover withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Link>{format(strings.ShowInstrumentLinkText, currentValue)}</Link>
      </PopoverTrigger>
      <PopoverSurface>
        <div>
          <div className={styles.gauge} style={{ width: '100%', alignItems: 'center' }}>
            <GaugeComponent
              type='semicircle'
              minValue={minimumValue}
              maxValue={maximumValue}
              arc={{
                colorArray: startValue > endValue ? ['#00FF15', '#FF2121'] : ['#FF2121', '#00FF15'],
                padding: 0.02,
                subArcs: subArcs
              }}
              labels={{
                valueLabel: {
                  style: {
                    fill: '#222',
                    color: '#222',
                    textShadow: 'none',
                    fontWeight: 'bold',
                    fontSize: '32px'
                  }
                }
              }}
              pointer={{ type: 'blob', animationDelay: 0.5 }}
              value={currentValue}
            />
            <Text>
              {format(strings.InstrumentUnitLabel, unit)}
            </Text>
            <div className={styles.description}>{description}</div>
          </div>
        </div>
      </PopoverSurface>
    </Popover>
  )
}

InstrumentColumn.key = 'instrument'
InstrumentColumn.id = 'Instrument'
InstrumentColumn.displayName = strings.ColumnRenderOptionInstrument
InstrumentColumn.iconName = 'SpeedHigh'
