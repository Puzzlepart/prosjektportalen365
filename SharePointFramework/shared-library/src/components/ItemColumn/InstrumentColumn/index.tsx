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
 * Opens a gauge popover showing the current measurement, unit and description.
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
