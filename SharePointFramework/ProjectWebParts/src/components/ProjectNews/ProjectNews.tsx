import {
  Button,
  FluentProvider,
  IdPrefixProvider,
  Spinner
} from '@fluentui/react-components'
import { NewsRegular, NewsFilled, bundleIcon } from '@fluentui/react-icons'
import React, { FC } from 'react'
import { format } from '@fluentui/react'

import { IProjectNewsProps } from './types'
import { customLightTheme, UserMessage, WebPartTitle } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import ProjectNewsDialog from './ProjectNewsDialog/NewsDialog'
import strings from 'ProjectWebPartsStrings'
import styles from './ProjectNews.module.scss'
import RecentNewsList from './ProjectNewsRecentNewsList/RecentNewsList'
import { useProjectNewsDialog } from './ProjectNewsDialog/useProjectNewsDialog'


export const ProjectNews: FC<IProjectNewsProps> = (props) => {
  const { context, fluentProviderId } = useProjectNews(props)
  const dialog = useProjectNewsDialog(props)
  const recentNews = context.state.data?.news || []
  const { loading, error } = context.state
  const NewsIcon = bundleIcon(NewsFilled, NewsRegular)
  const handleCreateNewsClick = React.useCallback(() => {
    dialog.setIsDialogOpen(true)
  }, [dialog])

  const handleCreateNewsKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        dialog.setIsDialogOpen(true)
      }
    },
    [dialog]
  )

  return (
    <ProjectNewsContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <section className={styles.projectNews}>
            {props.title && <WebPartTitle title={props.title} />}
            <div className={styles.createNewsLinkContainer}>
              <Button
                className={styles.button}
                appearance='subtle'
                icon={<NewsIcon />}
                iconPosition='before'
                onClick={handleCreateNewsClick}
                onKeyDown={handleCreateNewsKeyDown}
                aria-label={strings.CreateNewsLinkLabel}
                role='button'
                tabIndex={0}
                aria-haspopup='dialog'>
                {strings.CreateNewsLinkLabel}
              </Button>
            </div>
            {loading && (
              <div className={styles.loadingContainer}>
                <Spinner label={format(strings.LoadingText, props.title)} />
              </div>
            )}
            {error && (
              <div className={styles.errorContainer}>
                <UserMessage
                  intent='error'
                  text={error.message || strings.GenericErrorMessage}
                />
              </div>
            )}
            {!loading && !error && (
              <>
                <ProjectNewsDialog
                  open={dialog.isDialogOpen}
                  onOpenChange={dialog.setIsDialogOpen}
                  spinnerMode={dialog.spinnerMode}
                  title={dialog.title}
                  errorMessage={dialog.errorMessage}
                  onTitleChange={dialog.handleTitleChange}
                  onSubmit={dialog.handleCreate}
                  templates={dialog.templates}
                  selectedTemplate={dialog.selectedTemplate}
                  onTemplateChange={dialog.handleTemplateChange}
                />
                <RecentNewsList news={recentNews} maxVisible={props.maxVisibleNews} />
              </>
            )}
          </section>
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectNewsContext.Provider>
  )
}

ProjectNews.defaultProps = {
  siteUrl: 'https://puzzlepart.sharepoint.com/sites/prosjektportalen-news',
  maxVisibleNews: 6
}
