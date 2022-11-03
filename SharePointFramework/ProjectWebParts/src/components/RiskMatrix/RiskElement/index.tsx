import { TooltipHost } from '@fluentui/react'
import { replaceTokens } from 'pp365-shared/lib/util'
import React, { FC, useContext } from 'react'
import { RiskMatrixContext } from '../context'
import styles from './RiskElement.module.scss'
import { IRiskElementProps } from './types'

export const RiskElement: FC<IRiskElementProps> = (props) => {
  const context = useContext(RiskMatrixContext)
  
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
        <div className={styles.tooltip}>
          <span
            dangerouslySetInnerHTML={{
              __html: replaceTokens(context.calloutTemplate, props.model.item)
            }}></span>
        </div>
      }>
      <div className={styles.root} title={getTooltip()} style={props.style}>
        {props.model.id}
      </div>
    </TooltipHost>
  )
}
