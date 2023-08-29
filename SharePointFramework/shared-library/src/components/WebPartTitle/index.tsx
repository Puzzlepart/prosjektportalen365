import React, { FC } from 'react'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'

/**
 * A component that renders a webpart title properly according to the Fluent UI design guidelines.
 * Customizable with the following properties:
 * - title: the title to display
 */
export const WebPartTitle: FC<IWebPartTitleProps> = (props) => {
  return (
    <div className={styles.header} title={props.title}>
      <h2 className={styles.heading}>
        <span role='heading' aria-level={2} className={styles.title}>
          {props.title}
        </span>
      </h2>
    </div>
  )
}
