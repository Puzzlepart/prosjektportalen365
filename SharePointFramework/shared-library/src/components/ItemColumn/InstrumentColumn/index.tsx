import strings from 'SharedLibraryStrings'
import React from 'react'
import { ColumnRenderComponent } from '../types'
import styles from './InstrumentColumn.module.scss'
import { IInstrumentColumnProps } from './types'
import { useInstrumentColumn } from './useInstrumentColumn'
import { Link, Popover, PopoverSurface, PopoverTrigger, Text } from '@fluentui/react-components'
import GaugeComponent from 'react-gauge-component'
import { format } from '../../../util'

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
  } = useInstrumentColumn(props)

  return (
    <Popover withArrow trapFocus>
      <PopoverTrigger disableButtonEnhancement>
        <Link>{format(strings.ShowInstrumentLinkText || '{0}', currentValue ?? '')}</Link>
      </PopoverTrigger>
      {/* It holds no control: with a tab index the surface itself takes the focus as it opens, so a
          screen reader hears it, and the trap keeps the focus there until Escape (WCAG 2.4.3). */}
      <PopoverSurface tabIndex={-1} aria-label={label} aria-describedby={`${gaugeId} ${unitId}`}>
        <div>
          <div className={styles.gauge} style={{ width: '100%', alignItems: 'center' }}>
            {/* The text both names the drawing and describes the popover: a referenced
                aria-label is not read in a description everywhere. */}
            <span id={gaugeId} hidden>
              {gaugeLabel}
            </span>
            <div role='img' aria-labelledby={gaugeId} className={styles.drawing}>
              <GaugeComponent
                type='semicircle'
                minValue={minimumValue}
                maxValue={maximumValue}
                arc={{
                  colorArray:
                    startValue > endValue ? ['#00FF15', '#FF2121'] : ['#FF2121', '#00FF15'],
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
            </div>
            <Text id={unitId}>{format(strings.InstrumentUnitLabel || '{0}', unit ?? '')}</Text>
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
