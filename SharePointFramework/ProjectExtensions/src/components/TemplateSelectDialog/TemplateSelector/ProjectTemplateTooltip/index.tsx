import { stringIsNullOrEmpty } from '@pnp/common'
import { TooltipHost } from 'office-ui-fabric-react'
import React, { FunctionComponent } from 'react'
import styles from './ProjectTemplateTooltip.module.scss'
import { IProjectTemplateTooltipProps } from './types'

export const ProjectTemplateTooltip: FunctionComponent<IProjectTemplateTooltipProps> = ({
  template,
  children
}) => {
  if (stringIsNullOrEmpty(template.subText)) {
    return <>{children}</>
  }
  return (
    <TooltipHost
      calloutProps={{
        gapSpace: 75
      }}
      content={
        <div className={styles.root}>
          <div className={styles.header}>
            <span>{template.text}</span>
          </div>
          <div className={styles.description}>{template.subText}</div>
        </div>
      }>
      {children}
    </TooltipHost>
  )
}
