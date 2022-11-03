import { useState } from 'react'
import _, { last } from 'underscore'
import { IPropertyFieldColorConfigurationProps } from '../../types'

export function usePropertyFieldColorConfiguration(props: IPropertyFieldColorConfigurationProps) {
  const [config, setConfig] = useState(props.value)
  const [count, $setCount] = useState(config.length)

  /**
   * Set the count to a new value. Also updates the configuration.
   * 
   * @param count_ New count
   */
  function setCount(count_: number) {
    $setCount(count_)
    const inc = count_ - config.length
    const lastColor = last(config)?.color
    setConfig((config_) => {
      if (inc > 0) {
        for (let i = 0; i < inc; i++) {
          config_.push({
            color: props.value[config_.length + i]?.color ?? lastColor
          })
        }
      } else config_ = config_.splice(0, count_)
      return config_.map((c,idx) => ({
        ...c,
        percentage: Math.floor(10 + ((90/ config_.length) * idx))
      }))
    })
  }

  function onColorChange(idx: number, color: any) {
    setConfig((config_) => {
      config_[idx].color = color
      return config_
    })
  }

  let onSave: () => void = null

  if (!_.isEqual(props.value, config)) {
    onSave = () => {
      // eslint-disable-next-line no-console
      console.log(config)
    }
  }

  return { config, count, setCount, onColorChange, onSave } as const
}
