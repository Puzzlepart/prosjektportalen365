import { Label, Slider } from '@fluentui/react'
import { DEFAULT_COLOR_SCALE_CONFIG } from 'components/RiskMatrix/types'
import React, { FC } from 'react'
import { IPropertyFieldColorConfigurationProps } from '../../types'
import { ColorConfigElement } from './ColorConfigElement'
import styles from './PropertyFieldColorConfiguration.module.scss'
import { usePropertyFieldColorConfiguration } from './usePropertyFieldColorConfiguration'

export const PropertyFieldColorConfiguration: FC<IPropertyFieldColorConfigurationProps> = (
    props
) => {
    const { count, setCount, config, onColorChange } = usePropertyFieldColorConfiguration(props)
    return (
        <div className={styles.root}>
            <Label>{props.label}</Label>
            <Slider min={3} max={10} defaultValue={count} onChange={setCount} />
            <div className={styles.container}>
                {config.map(({ color }, idx) => (
                    <ColorConfigElement
                        key={idx}
                        color={`rgb(${color.join(',')})`}
                        onChange={(color) => onColorChange(idx, color)}
                    />
                ))}
            </div>
        </div>
    )
}

PropertyFieldColorConfiguration.defaultProps = {
    value: DEFAULT_COLOR_SCALE_CONFIG
}