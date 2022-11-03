import { TooltipHost } from '@fluentui/react'
import { replaceTokens } from 'pp365-shared/lib/util'
import React, { FC } from 'react'
import styles from './RiskElement.module.scss'
import { IRiskElementProps } from './types'

export const RiskElement: FC<IRiskElementProps> = (props) => {
  const getTooltip = () => {
    let tooltip = ''
    if (props.model.siteTitle) {
      tooltip += `${props.model.siteTitle}: `
    }
    tooltip += props.model.title
    return tooltip
  }

  return (
    <TooltipHost
      content={
        <span
          dangerouslySetInnerHTML={{
            __html: replaceTokens(props.calloutTemplate, props.model.item)
          }}></span>
      }>
      <div className={styles.root} title={getTooltip()} style={props.style}>
        {props.model.id}
      </div>
    </TooltipHost>
  )
}
