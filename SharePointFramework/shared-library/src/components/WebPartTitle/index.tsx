import React, { FC } from 'react'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'

/**
 * A component that renders a webpart title properly according to the Fluent UI design guidelines.
 * Customizable with the following properties:
 * - text: the text to display
 *
 * @category WebPartTitle
 */
export const WebPartTitle: FC<IWebPartTitleProps> = (props: IWebPartTitleProps) => {
  return (
    <div className={styles.header} title={props.text}>
      <span role='heading' aria-level={2}>
        {props.text}
      </span>
    </div>
  )
}
