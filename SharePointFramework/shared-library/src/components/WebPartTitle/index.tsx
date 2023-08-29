import React, { FC } from 'react'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'
import { Tooltip } from './Tooltip'

/**
 * Renders a web part title with an optional tooltip.
 *
 * @param props - The component props.
 * @param props.title - The title to display.
 * @param props.tooltip - The tooltip to display when hovering over the title.
 *
 * @returns The rendered component.
 */
export const WebPartTitle: FC<IWebPartTitleProps> = (props) => {
  return (
    <div className={styles.root} title={props.title}>
      <Tooltip {...props.tooltip}>
        <h2 className={styles.heading}>
          <span role='heading' aria-level={2} className={styles.title}>
            {props.title}
          </span>
        </h2>
      </Tooltip>
    </div>
  )
}
