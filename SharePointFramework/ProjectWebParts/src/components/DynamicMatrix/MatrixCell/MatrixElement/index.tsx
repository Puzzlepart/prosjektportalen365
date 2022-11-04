import { TooltipHost } from '@fluentui/react'
import { replaceTokens } from 'pp365-shared/lib/util'
import React, { FC, useContext } from 'react'
import { DynamicMatrixContext } from '../../context'
import styles from './MatrixElement.module.scss'
import { IMatrixElementProps } from './types'

export const MatrixElement: FC<IMatrixElementProps> = (props) => {
  const context = useContext(DynamicMatrixContext)

  return (
    <TooltipHost
      content={
        context.props?.calloutTemplate && (
          <div className={styles.tooltip}>
            <span
              dangerouslySetInnerHTML={{
                __html: replaceTokens(context.props?.calloutTemplate, props.model.item)
              }}></span>
          </div>
        )
      }>
      <div
        className={styles.root}
        title={props.model.tooltip}
        style={props.style}
        hidden={props.hidden}>
        {props.model.id}
      </div>
    </TooltipHost>
  )
}
