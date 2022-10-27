import { Icon, IDetailsRowCheckProps } from '@fluentui/react'
import React from 'react'

export function onRenderCheckLocked(props: IDetailsRowCheckProps) {
    return (
        <div id={props.id} className={props.className} style={{ width: 48, padding: 12, boxSizing: 'border-box' }}>
            <Icon iconName='Lock' styles={{ root: { fontSize: 15 } }} />
        </div >
    )
}