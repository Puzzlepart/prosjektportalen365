import React, { FC } from 'react'
import { InfoLabel } from '@fluentui/react-components/unstable'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'
import strings from 'SharedLibraryStrings'
import { format } from '@fluentui/react'

/**
 * Renders a web part title with an optional tooltip.
 *
 * @param props - The component props.
 * @param props.title - The title to display.
 * @param props.description - The tooltip to display when hovering over the title.
 *
 * @returns The rendered component.
 */
export const WebPartTitle: FC<IWebPartTitleProps> = (props) => {
  return (
    <div className={styles.root}>
      <h2 className={styles.heading} title={props.title}>
        <span role='heading' aria-level={2} className={styles.title}>
          {props.title}
        </span>
      </h2>
      {props.description &&
        <div className={styles.infoLabel} title={format(strings.Aria.InfoLabelTitle, props.title)}>
          <InfoLabel
            size='large'
            info={
              <div
                className={styles.infoLabelContent}
                dangerouslySetInnerHTML={{
                  __html: props.description
                }}
              />
            }
          />
        </div>
      }
    </div>
  )
}
