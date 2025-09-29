import { Button, FluentProvider, IdPrefixProvider, Spinner } from '@fluentui/react-components'
import React, { FC } from 'react'
import { format } from '@fluentui/react'
import { IProjectNewsProps } from './types'
import { customLightTheme, getFluentIcon, UserMessage, WebPartTitle } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import strings from 'ProjectWebPartsStrings'
import styles from './ProjectNews.module.scss'
import { RecentNews } from './RecentNews'
import { NewsDialog } from './NewsDialog'

export const ProjectNews: FC<IProjectNewsProps> = (props) => {
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

ProjectNews.defaultProps = {
  siteUrl: '',
  title: strings.ProjectNewsWebPartTitle,
  newsFolderName: strings.NewsFolderNameDefault,
  maxVisibleNews: 4
}
