import { DefaultButton, Label, Slider } from '@fluentui/react'
import { MATRIX_DEFAULT_COLOR_SCALE_CONFIG } from 'components/RiskMatrix/types'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { IPropertyFieldColorConfigurationProps } from '../../types'
import { ColorConfigElement } from './ColorConfigElement'
import styles from './PropertyFieldColorConfiguration.module.scss'
import { usePropertyFieldColorConfiguration } from './usePropertyFieldColorConfiguration'

export const PropertyFieldColorConfiguration: FC<IPropertyFieldColorConfigurationProps> = (
  props
) => {
  const { count, setCount, config, onColorChange, onSave } = usePropertyFieldColorConfiguration(
    props
  )
  return (
    <div className={styles.root}>
      <Label>{props.label}</Label>
      <Slider min={3} max={8} defaultValue={count} onChange={setCount} />
      <div className={styles.container}>
        {config.map(({ percentage, color }, idx) => (
          <ColorConfigElement
            key={idx}
            percentage={percentage}
            color={`rgb(${color.join(',')})`}
            onChange={(color) => onColorChange(idx, color)}
          />
        ))}
      </div>
      <div className={styles.saveBtn}>
        <DefaultButton
          text={strings.SaveColorConfigurationText}
          onClick={onSave && onSave}
          disabled={!onSave}
        />
      </div>
    </div>
  )
}

PropertyFieldColorConfiguration.defaultProps = {
  value: MATRIX_DEFAULT_COLOR_SCALE_CONFIG
}
