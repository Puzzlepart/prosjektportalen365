import React, { FC } from 'react'
import { FluentProvider, IdPrefixProvider, InfoLabel, useId } from '@fluentui/react-components'
import { IWebPartTitleProps } from './types'
import styles from './WebPartTitle.module.scss'
import strings from 'SharedLibraryStrings'
import { customLightTheme, format } from '../../util'

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
  // The info button's name: Fluent names it "information" when its label is empty, as it is here.
  const infoName = format(strings.Aria.InfoLabelTitle, props?.title)
  // A section inside a web part takes the level below the web part's own title.
  const Heading = props?.headingLevel === 3 ? 'h3' : 'h2'

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider id={fluentProviderId} className={styles.root} theme={customLightTheme}>
        <Heading className={styles.heading} title={props?.title} hidden={!props?.title}>
          <span className={styles.title}>{props?.title}</span>
        </Heading>
        {props?.description && (
          <div className={styles.infoLabel} title={infoName}>
            <InfoLabel
              size='large'
              infoButton={{ 'aria-label': infoName }}
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
