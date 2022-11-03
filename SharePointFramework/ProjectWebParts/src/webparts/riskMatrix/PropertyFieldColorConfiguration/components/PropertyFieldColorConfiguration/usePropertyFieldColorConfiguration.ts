import { IColor } from '@fluentui/react'
import { MATRIX_DEFAULT_COLOR_SCALE_CONFIG } from 'components/RiskMatrix'
import { useState } from 'react'
import _, { last } from 'underscore'
import { IPropertyFieldColorConfigurationProps } from '../../types'

export function usePropertyFieldColorConfiguration(props: IPropertyFieldColorConfigurationProps) {
  const [config, $setConfig] = useState(props.value)

  /**
   * Set configuration
   *
   * @param count New count
   */
  function setConfig(count: number) {
    const inc = count - config.length
    const lastColor = last(config)?.color
    $setConfig(($config) => {
      if (inc > 0) {
        for (let i = 0; i < inc; i++) {
          $config.push({
            color: props.value[$config.length + i]?.color ?? lastColor
          })
        }
      } else $config = $config.splice(0, count)
      return $config.map((c, idx) => ({
        percentage: Math.floor(Math.round((10 + (90 / $config.length) * idx) / 10) * 10),
        color: c.color
      }))
    })
  }

  function onColorChange(idx: number, color: IColor) {
    $setConfig(($config) => $config.map((c, i) => (idx === i ? { ...c, color: [color.r, color.g, color.b] } : c)))
  }

  let onSave: () => void = null
  let onRevertDefault: () => void = null

  if (!_.isEqual(props.value, config)) {
    onSave = () => props.onChange(null, config)
  }
  if (!_.isEqual(MATRIX_DEFAULT_COLOR_SCALE_CONFIG, config)) {
    onRevertDefault = () => {
      $setConfig(MATRIX_DEFAULT_COLOR_SCALE_CONFIG)
      props.onChange(null, MATRIX_DEFAULT_COLOR_SCALE_CONFIG)
    }
  }

  return { config, setConfig, onColorChange, onSave, onRevertDefault } as const
}
