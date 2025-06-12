import { FluentProvider, IdPrefixProvider, Link } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IProjectNewsProps } from './types'
import { customLightTheme } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import ProjectNewsDialog from './ProjectNewsDialogue/NewsDialogue'
import strings from 'ProjectWebPartsStrings'
import { SPHttpClient } from '@microsoft/sp-http'
import RecentNewsList from './ProjectNewsRecentNewsList/RecentNewsList'
import { ensureProjectNewsFolder, getServerRelativeUrl } from './util'

export const ProjectNews: FC<IProjectNewsProps> = (props) => {
  const { context, fluentProviderId } = useProjectNews(props)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [spinnerMode, setSpinnerMode] = React.useState<'idle' | 'creating' | 'success'>('idle')
  const [title, setTitle] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [templates, setTemplates] = React.useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | undefined>(undefined)
  const folderName = props.newsFolderName || strings.NewsFolderNameDefault

  React.useEffect(() => {
    if (isDialogOpen) {
      const url = `${props.siteUrl}/_api/web/GetFolderByServerRelativeUrl('SitePages/Templates')/Files?$select=Name,ServerRelativeUrl`
      props.spHttpClient
        .get(url, SPHttpClient.configurations.v1)
        .then((res) => res.json())
        .then((data) => setTemplates(data.value || []))
        .catch(() => setTemplates([]))
    }
  }, [isDialogOpen])

  const handleTitleChange = (_: React.FormEvent, data: { value: string }) => {
    setTitle(data.value)
    setErrorMessage('')
  }

  const handleTemplateChange = (_: React.FormEvent, data: { optionValue: string }) => {
    setSelectedTemplate(data.optionValue)
    setErrorMessage('')
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMessage(strings.NewsTitleRequired)
      return
    }
    if (!selectedTemplate) {
      setErrorMessage(strings.TemplateRequired)
      return
    }
    setSpinnerMode('creating')
    setErrorMessage('')
    try {
      await ensureProjectNewsFolder(props.siteUrl, props.spHttpClient, folderName)
      const newPageName = `${title.replace(/\s+/g, '-')}-${Date.now()}.aspx`
      const newPageServerRelativeUrl = getServerRelativeUrl(
        props.siteUrl,
        'SitePages',
        folderName,
        newPageName
      )
      const copyUrl = `${props.siteUrl}/_api/web/GetFileByServerRelativeUrl('${selectedTemplate}')/copyTo(strNewUrl='${newPageServerRelativeUrl}',bOverWrite=false)`
      const res = await props.spHttpClient.post(copyUrl, SPHttpClient.configurations.v1, {
        headers: { Accept: 'application/json;odata=nometadata' }
      })
      if (res.ok) {
        // --- Update PromotedState and PageLayoutType ---
        const listItemUrl = `${props.siteUrl}/_api/web/lists/GetByTitle('Site Pages')/items?$filter=FileLeafRef eq '${newPageName}'`
        const listItemRes = await props.spHttpClient.get(
          listItemUrl,
          SPHttpClient.configurations.v1
        )
        const listItemData = await listItemRes.json()
        const itemId = listItemData.value?.[0]?.Id
        if (itemId) {
          const updateUrl = `${props.siteUrl}/_api/web/lists/GetByTitle('Site Pages')/items(${itemId})`
          await props.spHttpClient.post(updateUrl, SPHttpClient.configurations.v1, {
            headers: {
              Accept: 'application/json;odata=nometadata',
              'Content-Type': 'application/json;odata=verbose',
              'IF-MATCH': '*',
              'X-HTTP-Method': 'MERGE'
            },
            body: JSON.stringify({
              PromotedState: 2,
              PageLayoutType: 'Article'
            })
          })
        }
        // --- End update ---
        setSpinnerMode('success')
        setTimeout(() => {
          setIsDialogOpen(false)
          setSpinnerMode('idle')
          setTitle('')
          setSelectedTemplate(undefined)

          const serverRelative = getServerRelativeUrl(
            props.siteUrl,
            'SitePages',
            folderName,
            newPageName
          ).replace(/^\//, '')
          const editUrl = `${props.siteUrl}/${serverRelative}?Mode=Edit`
          window.open(editUrl, '_blank')
        }, 1200)
      } else {
        const error = await res.json()
        setErrorMessage(strings.NewsCreateError + error.error?.message?.value)
        setSpinnerMode('idle')
      }
    } catch (err) {
      setErrorMessage(strings.NewsCreateError + (err as Error).message)
      setSpinnerMode('idle')
    }
  }

  const news = (context.state.data?.news || []).map((item) => ({
    name: item.Title,
    url: `${props.siteUrl}/SitePages/${folderName}/${item.FileLeafRef}`,
    authorName: item.Editor?.Title,
    modifiedDate: item.Modified,
    imageUrl: item.BannerImageUrl,
    description: item.Description
  }))

  return (
    <ProjectNewsContext.Provider value={context}>
      <IdPrefixProvider value={fluentProviderId}>
        <FluentProvider theme={customLightTheme}>
          <section>
            <h2>{strings.ProjectNewsWebPartTitle}</h2>
            <div>
              <Link onClick={() => setIsDialogOpen(true)}>{strings.CreateNewsLinkLabel}</Link>
            </div>
            <ProjectNewsDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              spinnerMode={spinnerMode}
              title={title}
              errorMessage={errorMessage}
              onTitleChange={handleTitleChange}
              onSubmit={handleCreate}
              templates={templates}
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
            />
            <RecentNewsList news={news} maxVisible={props.maxVisibleNews} />
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
