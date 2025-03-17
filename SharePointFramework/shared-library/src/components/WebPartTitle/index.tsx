import React, { FC } from 'react'
import { FluentProvider, IdPrefixProvider, InfoLabel, useId } from '@fluentui/react-components'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'
import strings from 'SharedLibraryStrings'
import { format } from '@fluentui/react'
import { customLightTheme } from '../../util'

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
  const fluentProviderId = useId('fp-webpart-title')

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider id={fluentProviderId} className={styles.root} theme={customLightTheme}>
        <h2 className={styles.heading} title={props?.title} hidden={!props?.title}>
          <span role='heading' aria-level={2} className={styles.title}>
            {props?.title}
          </span>
        </h2>
        {props?.description && (
          <div
            className={styles.infoLabel}
            title={format(strings.Aria.InfoLabelTitle, props?.description)}
          >
            <InfoLabel
              size='large'
              info={
                <div
                  className={styles.infoLabelContent}
                  dangerouslySetInnerHTML={{
                    __html: props?.description
                  }}
                />
              }
            />
          </div>
        )}
      </FluentProvider>
    </IdPrefixProvider>
  )
}
