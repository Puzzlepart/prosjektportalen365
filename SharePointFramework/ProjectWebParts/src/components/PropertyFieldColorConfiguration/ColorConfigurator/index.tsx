import { DefaultButton, Label, PrimaryButton, Slider } from '@fluentui/react'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ColorConfigElement } from './ColorConfigElement'
import styles from './PropertyFieldColorConfiguration.module.scss'
import { CHANGE_CONFIG_COLOR, SET_CONFIG } from './reducer'
import { IColorConfiguratorProps } from './types'
import { usePropertyFieldColorConfiguration } from './usePropertyFieldColorConfiguration'

export const ColorConfigurator: FC<IColorConfiguratorProps> = (props) => {
  const { state, dispatch, onSave, onRevertDefault } = usePropertyFieldColorConfiguration(props)
  return (
    <div className={styles.root}>
      <Label>{props.label}</Label>
      <Slider
        min={props.minColors}
        max={props.maxColors}
        value={state.config.length}
        onChange={(count) => dispatch(SET_CONFIG({ count }))}
      />
      <div className={styles.container}>
        {state.config.map(({ percentage, color }, index) => (
          <ColorConfigElement
            key={index}
            percentage={percentage}
            color={color}
            onChange={(_, color) => dispatch(CHANGE_CONFIG_COLOR({ index, color }))}
          />
        ))}
      </div>
      <div className={styles.actions}>
        <PrimaryButton
          text={strings.SaveColorConfigurationText}
          onClick={onSave && onSave}
          disabled={!onSave}
        />
        <DefaultButton
          text={strings.RevertDefaultColorConfigurationText}
          onClick={onRevertDefault && onRevertDefault}
          disabled={!onRevertDefault}
        />
      </div>
    </div>
  )
}

ColorConfigurator.defaultProps = {
  minColors: 3,
  maxColors: 8
}
