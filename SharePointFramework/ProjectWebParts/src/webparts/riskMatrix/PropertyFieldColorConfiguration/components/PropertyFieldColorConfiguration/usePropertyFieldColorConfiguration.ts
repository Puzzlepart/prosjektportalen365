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
    setConfig(($config) => {
      if (inc > 0) {
        for (let i = 0; i < inc; i++) {
          $config.push({
            color: props.value[$config.length + i]?.color ?? lastColor
          })
        }
      } else $config = $config.splice(0, count_)
      return $config.map((c, idx) => ({
        ...c,
        percentage: Math.floor(10 + ((90 / $config.length) * idx))
      }))
    })
  }

  function onColorChange(idx: number, color: any) {
    setConfig(($config) => $config.map((c, i) => idx === i ? { ...c, color } : c))
  }

  let onSave: () => void = null

  if (!_.isEqual(props.value, config)) {
    onSave = () => props.onChange(null, config)
  }

  return { config, count, setCount, onColorChange, onSave } as const
}
