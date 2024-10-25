import { FluentProvider, IdPrefixProvider } from '@fluentui/react-components'
import * as strings from 'PortfolioWebPartsStrings'
import { UserMessage, customLightTheme } from 'pp365-shared-library'
import React, { FC } from 'react'
import { isEmpty } from 'underscore'
import styles from './IdeaList.module.scss'
import { useIdeaList } from './useIdeaList'
import { useIdeaListRenderer } from './useIdeaListRenderer'
import { Commands } from './Commands'
import { IIdeaModuleProps } from '../types'

export const IdeaList: FC<IIdeaModuleProps> = (props) => {
  const { context, fluentProviderId } = useIdeaList(props)
  const renderIdeas = useIdeaListRenderer(context)

  if (context.state.ideas.data.items.length === 0) {
    return (
      <FluentProvider theme={customLightTheme}>
        <section className={styles.ideaList}>
          <UserMessage title={strings.NoProjectsFoundTitle} text={strings.NoProjectsFoundMessage} />
        </section>
      </FluentProvider>
    )
  }

  if (context.state.error) {
    return (
      <FluentProvider theme={customLightTheme}>
        <section className={styles.ideaList}>
          <UserMessage
            title={strings.ErrorFetchingProjectsTitle}
            text={context.state.error}
            intent='error'
          />
        </section>
      </FluentProvider>
    )
  }

  return (
    <IdPrefixProvider value={fluentProviderId}>
      <FluentProvider className={styles.ideaList} theme={customLightTheme}>
        <Commands />
        {context.state.loading && isEmpty(context.state.ideas) && (
          <div className={styles.emptyMessage}>
            <UserMessage
              title={strings.NoProjectsFoundTitle}
              text={strings.ProjectListEmptyMessage}
            />
          </div>
        )}
        <div className={styles.ideas}>{renderIdeas(context.state.ideas)}</div>
      </FluentProvider>
    </IdPrefixProvider>
  )
}
