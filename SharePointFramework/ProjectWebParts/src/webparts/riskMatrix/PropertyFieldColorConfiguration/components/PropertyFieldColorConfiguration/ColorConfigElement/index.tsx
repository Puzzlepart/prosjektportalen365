import { ColorPicker, TooltipHost } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './PropertyFieldColorConfiguration.module.scss'

export const ColorConfigElement: FC<{ color: string }> = (props) => {
    return (
        <TooltipHost
            content={<ColorPicker color={props.color} showPreview={true} />}>
            <div className={styles.root} style={{ backgroundColor: props.color }}>

            </div>
        </TooltipHost>
    )
}