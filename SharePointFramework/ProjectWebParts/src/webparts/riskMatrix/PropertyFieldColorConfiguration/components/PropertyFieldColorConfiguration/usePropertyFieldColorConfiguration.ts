import { useState } from 'react'
import { last } from 'underscore'
import { IPropertyFieldColorConfigurationProps } from '../../types'

export function usePropertyFieldColorConfiguration(props: IPropertyFieldColorConfigurationProps) {
    const [config, setConfig] = useState(props.value)
    const [count, $setCount] = useState(config.length)

    function setCount(count_: number) {
        $setCount(count_)
        // eslint-disable-next-line no-console
        const inc = count_ - config.length
        const lastColor = last(config)?.color
        setConfig(config_ => {
            if (inc > 0) {
                for(let i=0; i < inc; i++) {
                    config_.push({
                        color: lastColor
                    })
                }
            }
            else config_ = config_.splice(0, count_)
            return config_
        })
    }

    function onColorChange(idx: number, color: any) {
        setConfig(config_ => {
            config_[idx].color = color
            return config_
        })
    }

    return { config, count, setCount, onColorChange } as const
}
