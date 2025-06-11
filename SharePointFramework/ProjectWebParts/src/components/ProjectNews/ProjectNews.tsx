import { FluentProvider, IdPrefixProvider, Link } from '@fluentui/react-components'
import React, { FC } from 'react'
import { IProjectNewsProps } from './types'
import { customLightTheme } from 'pp365-shared-library'
import { useProjectNews } from './useProjectNews'
import { ProjectNewsContext } from './context'
import ProjectNewsDialog from './ProjectNewsDialogue/NewsDialogue'
import strings from 'ProjectWebPartsStrings'
import { SPHttpClient } from '@microsoft/sp-http'

export const ProjectNews: FC<IProjectNewsProps> = (props) => {
  const { context, fluentProviderId } = useProjectNews(props)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [spinnerMode, setSpinnerMode] = React.useState<'idle' | 'creating' | 'success'>('idle')
  const [title, setTitle] = React.useState('')
  const [errorMessage, setErrorMessage] = React.useState('')
  const [templates, setTemplates] = React.useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | undefined>(undefined)

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
      const newPageName = `${title.replace(/\s+/g, '-')}-${Date.now()}.aspx`
      const newPageUrl = `/SitePages/${newPageName}`
      const copyUrl = `${props.siteUrl}/_api/web/GetFileByServerRelativeUrl('${selectedTemplate}')/copyTo(strNewUrl='${newPageUrl}',bOverWrite=false)`
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

          window.open(
            `${props.siteUrl}/SitePages/${encodeURIComponent(newPageName)}?Mode=Edit`,
            '_blank'
          )
        }, 1200)
      } else {
        const error = await res.json()
        setErrorMessage(error.error?.message?.value || strings.NewsCreateError)
        setSpinnerMode('idle')
      }
    } catch (err) {
      setErrorMessage(strings.NewsCreateError)
      setSpinnerMode('idle')
    }
  }

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
          </section>
        </FluentProvider>
      </IdPrefixProvider>
    </ProjectNewsContext.Provider>
  )
}

ProjectNews.defaultProps = {
  siteUrl: 'https://puzzlepart.sharepoint.com/sites/prosjektportalen-news'
}
