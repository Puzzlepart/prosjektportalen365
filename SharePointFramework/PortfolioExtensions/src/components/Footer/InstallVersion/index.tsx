import { ActionButton, TooltipHost } from '@fluentui/react'
import React, { FC, useContext } from 'react'
import { FooterContext } from '../context'
import styles from './InstallVersion.module.scss'
import { InstallVersionTooltipContent } from './InstallVersionTooltipContent'

export const InstallVersion: FC = () => {
  const context = useContext(FooterContext)
  return (
    <TooltipHost
      hostClassName={styles.root}
      calloutProps={{ gapSpace: 0, calloutMaxWidth: 450 }}
      hidden={false}
      content={<InstallVersionTooltipContent />}
    >
      <ActionButton
        text={context.installedVersion}
        iconProps={{ iconName: 'ProductList' }}
        styles={{ root: { fontSize: 12, height: 25 }, icon: { fontSize: 12 } }}
      />
    </TooltipHost>
  )
}
