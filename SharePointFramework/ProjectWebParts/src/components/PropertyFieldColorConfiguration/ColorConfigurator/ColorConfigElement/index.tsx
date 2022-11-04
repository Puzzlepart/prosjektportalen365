import { Callout, ColorPicker, Slider } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import styles from './ColorConfigElement.module.scss'
import { IColorConfigElementProps } from './types'
import { useColorConfigElement } from './useColorConfigElement'

export const ColorConfigElement: FC<IColorConfigElementProps> = (props) => {
  const { ref, isEditing, setIsEditing, rgbColorString, percentage } = useColorConfigElement(props)
  return (
    <div
      ref={ref}
      className={styles.root}
      style={{ backgroundColor: rgbColorString }}
      onClick={() => setIsEditing(true)}>
      <div className={styles.container}>{percentage}%</div>
      {isEditing && (
        <Callout
          target={ref.current}
          gapSpace={props.gapSpace}
          preventDismissOnScroll={true}
          onDismiss={() => setIsEditing(false)}>
          <div className={styles.calloutContent}>
            <ColorPicker
              color={rgbColorString}
              strings={strings.ColorPickerStrings}
              alphaType='none'
              showPreview={true}
              onChange={props.onChangeColor}
            />
            <Slider
              value={percentage}
              step={1}
              min={props.min}
              max={props.max}
              onChange={props.onChangePercentage}
              valueFormat={(value) => `${value}%`}
            />
          </div>
        </Callout>
      )}
    </div>
  )
}

ColorConfigElement.defaultProps = {
  gapSpace: 10,
  min: 0,
  max: 100
}
