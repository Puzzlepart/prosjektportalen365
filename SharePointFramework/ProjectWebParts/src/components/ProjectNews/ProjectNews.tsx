import {
  Button,
  FluentProvider,
  IdPrefixProvider,
  MessageBar,
  Spinner
} from '@fluentui/react-components'
import { NewsRegular, NewsFilled, bundleIcon } from '@fluentui/react-icons'
import React, { FC } from 'react'

import { IProjectNewsProps } from './types'
import { customLightTheme, WebPartTitle } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import ProjectNewsDialog from './ProjectNewsDialogue/NewsDialogue'
import strings from 'ProjectWebPartsStrings'
import styles from './ProjectNews.module.scss'
import RecentNewsList from './ProjectNewsRecentNewsList/RecentNewsList'
import { useProjectNewsDialog } from './ProjectNewsDialogue/useProjectNewsDialogue'


export const ProjectNews: FC<IProjectNewsProps> = (props) => {
  const { context, fluentProviderId } = useProjectNews(props)
  const dialogue = useProjectNewsDialog(props)
  const recentNews = context.state.data?.news || []
  const { loading, error } = context.state
  const NewsIcon = bundleIcon(NewsFilled, NewsRegular)
  const handleCreateNewsClick = React.useCallback(() => {
    dialogue.setIsDialogOpen(true)
  }, [dialogue])

  const handleCreateNewsKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        dialogue.setIsDialogOpen(true)
      }
    },
    [dialogue]
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
                <Spinner label={strings.LoadingLabel} />
              </div>
            )}
            {error && (
              <div className={styles.errorContainer}>
                <MessageBar intent='error'>
                  {error.message || strings.GenericErrorMessage}
                </MessageBar>
              </div>
            )}
            {!loading && !error && (
              <>
                <ProjectNewsDialog
                  open={dialogue.isDialogOpen}
                  onOpenChange={dialogue.setIsDialogOpen}
                  spinnerMode={dialogue.spinnerMode}
                  title={dialogue.title}
                  errorMessage={dialogue.errorMessage}
                  onTitleChange={dialogue.handleTitleChange}
                  onSubmit={dialogue.handleCreate}
                  templates={dialogue.templates}
                  selectedTemplate={dialogue.selectedTemplate}
                  onTemplateChange={dialogue.handleTemplateChange}
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
