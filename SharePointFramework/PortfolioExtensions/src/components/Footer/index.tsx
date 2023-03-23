import { TooltipHost } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './Footer.module.scss'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'
import { IFooterProps } from './types'
import { useFooter } from './useFooter'

export const Footer: FC<IFooterProps> = (props) => {
    const { latestEntry,installedVersion } = useFooter(props)
    return (
        <div className={styles.root}>
            <div className={styles.content}>
                <section className={styles.left}>
                    <TooltipHost
                        hostClassName={styles.installVersion}
                        calloutProps={{ gapSpace: 0, calloutMaxWidth: 450 }}
                        hidden={false}
                        content={<InstallVersionTooltipContent latestEntry={latestEntry} />}>
                        {installedVersion}
                    </TooltipHost>
                </section>
                <section className={styles.right}></section>
            </div>
        </div>
    )
}