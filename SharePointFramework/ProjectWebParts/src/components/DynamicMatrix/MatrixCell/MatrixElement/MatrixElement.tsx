import { format, replaceTokens } from 'pp365-shared-library/lib/util'
import * as strings from 'ProjectWebPartsStrings'
import React, { FC, useContext } from 'react'
import { DynamicMatrixContext } from '../../context'
import { IMatrixElementProps } from './types'
import { Badge, Tooltip, useId } from '@fluentui/react-components'
import styles from './MatrixElement.module.scss'

/**
 * An element of the matrix: its number on a badge, named by its number and what it is, and
 * reachable by the keyboard, which shows the callout's tooltip as the mouse does (WCAG 2.1.1).
 * The callout's text is its description, so a screen reader reads it without the tooltip.
 */
export const MatrixElement: FC<IMatrixElementProps> = (props) => {
  const context = useContext(DynamicMatrixContext)
  const detailsId = useId('matrix-element-details')
  const details =
    context.props?.calloutTemplate &&
    replaceTokens(context.props?.calloutTemplate, props.model.item)
  return (
    <>
      <Tooltip
        withArrow
        relationship='inaccessible'
        content={
          details && (
            <div>
              <span dangerouslySetInnerHTML={{ __html: details }} />
            </div>
          )
        }
      >
        <Badge
          className={styles.matrixElement}
          appearance='filled'
          color='informative'
          title={props.title}
          style={props.style}
          hidden={props.hidden}
          role='img'
          tabIndex={0}
          aria-label={
            props.title
              ? format(strings.Aria.NameValueLabel, props.model.id, props.title)
              : String(props.model.id)
          }
          aria-describedby={details ? detailsId : undefined}
        >
          {props.model.id}
        </Badge>
      </Tooltip>
      {details && <span id={detailsId} hidden dangerouslySetInnerHTML={{ __html: details }} />}
    </>
  )
}
