import { Label, Slider } from '@fluentui/react'
import React, { FC } from 'react'
import { IPropertyFieldColorConfigurationProps } from '../../types'
import { ColorConfigElement } from './ColorConfigElement'
import styles from './PropertyFieldColorConfiguration.module.scss'
import { usePropertyFieldColorConfiguration } from './usePropertyFieldColorConfiguration'

export const PropertyFieldColorConfiguration: FC<IPropertyFieldColorConfigurationProps> = (props) => {
    const { value, setValue, config } = usePropertyFieldColorConfiguration(props)
    return (
        <div className={styles.root}>
            <Label>{props.label}</Label>
            <Slider min={3} max={10} defaultValue={value} onChange={setValue} />
            <div className={styles.container}>
                {config.map(({ color }, idx) => <ColorConfigElement key={idx} color={`rgb(${color.join(',')})`} />)}
            </div>
        </div>
    )
}