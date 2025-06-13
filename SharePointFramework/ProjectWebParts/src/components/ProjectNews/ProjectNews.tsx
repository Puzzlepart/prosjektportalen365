import { FluentProvider, IdPrefixProvider, Link, MessageBar, Spinner } from '@fluentui/react-components'
import React, { FC } from 'react'

import { IProjectNewsProps } from './types'
import { customLightTheme } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import ProjectNewsDialog from './ProjectNewsDialogue/NewsDialogue'
import strings from 'ProjectWebPartsStrings'
import RecentNewsList from './ProjectNewsRecentNewsList/RecentNewsList'
import { useProjectNewsDialog } from './ProjectNewsDialogue/useProjectNewsDialogue'

export const ProjectNews: FC<IProjectNewsProps> = (props) => {
  const { context, fluentProviderId } = useProjectNews(props)
  const dialogue = useProjectNewsDialog(props)
  const recentNews = context.state.data?.news || []
  const { loading, error } = context.state

  return (
    <ProjectNewsContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <section>
            <h2>{strings.ProjectNewsWebPartTitle}</h2>
            <div>
              <Link
                role='button'
                tabIndex={0}
                aria-haspopup='dialog'
                aria-label={strings.CreateNewsLinkLabel}
                onClick={() => dialogue.setIsDialogOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    dialogue.setIsDialogOpen(true)
                  }
                }}>
                {strings.CreateNewsLinkLabel}
              </Link>
            </div>
            {loading && (
              <div style={{ margin: '24px 0', textAlign: 'center' }}>
                <Spinner label={strings.LoadingLabel} />
              </div>
            )}
            {error && (
              <div style={{ margin: '24px 0' }}>
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
