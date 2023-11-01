import React, { FC } from 'react'
import { InfoLabel } from '@fluentui/react-components'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'
import strings from 'SharedLibraryStrings'
import { format } from '@fluentui/react'
import { FluentProvider, useId, webLightTheme } from '@fluentui/react-components'

/**
 * Renders a web part title with an optional tooltip.
 *
 * @param props - The component props.
 * @param props.title - The title to display.
 * @param props.description - The description to display when clicking the InfoLabel.
 *
 * @returns The rendered component.
 */
export const WebPartTitle: FC<IWebPartTitleProps> = (props) => {
  const fluentProviderId = useId('fluent-provider')

  return (
    <FluentProvider id={fluentProviderId} className={styles.root} theme={webLightTheme}>
      <h2 className={styles.heading} title={props.title} hidden={!props.title}>
        <span role='heading' aria-level={2} className={styles.title}>
          {props.title}
        </span>
      </h2>
      {props.description && (
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
      )}
    </FluentProvider>
  )
}
