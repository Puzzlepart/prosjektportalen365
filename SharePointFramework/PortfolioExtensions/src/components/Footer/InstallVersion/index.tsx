import { TooltipHost } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import styles from './InstallVersion.module.scss'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'

export const InstallVersion: FC = () => {
    const { installedVersion } = useContext(FooterContext)
    return (
        <TooltipHost
            hostClassName={styles.root}
            calloutProps={{ gapSpace: 0, calloutMaxWidth: 450 }}
            hidden={false}
            content={<InstallVersionTooltipContent />}
        >
            {installedVersion}
        </TooltipHost>
    )
}