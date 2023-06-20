import { DefaultButton, Label, PrimaryButton, Slider } from '@fluentui/react'
import { get } from '@microsoft/sp-lodash-subset'
import strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { ColorConfigElement } from './ColorConfigElement'
import styles from './PropertyFieldColorConfiguration.module.scss'
import { CHANGE_CONFIG, SET_CONFIG } from './reducer'
import { IColorConfiguratorProps } from './types'
import { usePropertyFieldColorConfiguration } from './usePropertyFieldColorConfiguration'

export const ColorConfigurator: FC<IColorConfiguratorProps> = (props) => {
  const { state, dispatch, onSave, onRevertDefault } =
    usePropertyFieldColorConfiguration(props)
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
        {state.config.map((config, index) => (
          <ColorConfigElement
            key={index}
            config={config}
            onChangeColor={(_, color) =>
              dispatch(CHANGE_CONFIG({ index, color }))
            }
            onChangePercentage={(percentage) =>
              dispatch(CHANGE_CONFIG({ index, percentage }))
            }
            min={get(state, `config[${index - 1}].p`, 0) + 2}
            max={get(state, `config[${index + 1}].p`, 100) - 2}
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
