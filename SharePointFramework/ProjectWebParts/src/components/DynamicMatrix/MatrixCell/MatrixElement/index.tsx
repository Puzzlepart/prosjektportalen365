import { replaceTokens } from 'pp365-shared-library/lib/util'
import React, { FC, useContext } from 'react'
import { DynamicMatrixContext } from '../../context'
import { IMatrixElementProps } from './types'
import { CounterBadge, Tooltip } from '@fluentui/react-components'
import styles from './MatrixElement.module.scss'

export const MatrixElement: FC<IMatrixElementProps> = (props) => {
  const context = useContext(DynamicMatrixContext)
  return (
    <Tooltip
      withArrow
      relationship='description'
      content={
        context.props?.calloutTemplate && (
          <div>
            <span
              dangerouslySetInnerHTML={{
                __html: replaceTokens(context.props?.calloutTemplate, props.model.item)
              }}
            ></span>
          </div>
        )
      }
    >
      <CounterBadge
        className={styles.matrixElement}
        appearance='filled'
        color='informative'
        count={props.model.id}
        title={props.title}
        style={props.style}
        hidden={props.hidden}
      />
    </Tooltip>
  )
}
