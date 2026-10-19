import { Button, FluentProvider, IdPrefixProvider, Spinner } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IProjectNewsProps } from './types'
import {
  customLightTheme,
  getFluentIcon,
  UserMessage,
  WebPartTitle,
  format,
  withDefaults
} from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import strings from 'ProjectWebPartsStrings'
import styles from './ProjectNews.module.scss'
import { RecentNews } from './RecentNews'
import { NewsDialog } from './NewsDialog'

const PROJECT_NEWS_DEFAULT_PROPS: Partial<IProjectNewsProps> = {
  siteUrl: '',
  title: strings.ProjectNewsWebPartTitle,
  newsFolderName: strings.NewsFolderNameDefault,
  maxVisibleNews: 4
}

export const ProjectNews: FC<IProjectNewsProps> = (incomingProps) => {
  const props = withDefaults(incomingProps, PROJECT_NEWS_DEFAULT_PROPS)
  const { context, recentNews, fluentProviderId } = useProjectNews(props)

  return (
    <ProjectNewsContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <section className={styles.projectNews}>
            {props.title && <WebPartTitle title={props.title} description={props.description} />}
            <Button
              className={styles.button}
              appearance='subtle'
              icon={getFluentIcon('News')}
              iconPosition='before'
              onClick={() => context.setState({ isDialogOpen: true })}
              aria-label={strings.CreateNewsLinkLabel}
              role='button'
              tabIndex={0}
              aria-haspopup='dialog'
            >
              {strings.CreateNewsLinkLabel}
            </Button>
            {context.state.loading && (
              <div className={styles.loadingContainer}>
                <Spinner label={format(strings.LoadingText, props.title)} />
              </div>
            )}
            {context.state.error && (
              <div className={styles.errorContainer}>
                <UserMessage
                  intent='error'
                  text={context.state.error.message || strings.GenericErrorMessage}
                />
              </div>
            )}
            {!context.state.loading && !context.state.error && (
              <>
                <NewsDialog />
                <RecentNews news={recentNews} maxVisible={props.maxVisibleNews} />
              </>
            )}
          </section>
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectNewsContext.Provider>
  )
}
