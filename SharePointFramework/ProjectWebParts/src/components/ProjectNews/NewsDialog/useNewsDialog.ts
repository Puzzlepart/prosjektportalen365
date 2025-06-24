import { useState, useEffect, useCallback } from 'react'

import strings from 'ProjectWebPartsStrings'
import {
  ensureProjectNewsFolder,
  getTemplates,
  getNewsPageName,
  getServerRelativeUrl,
  copyTemplatePage,
  getNewsEditUrl,
  setOriginalSourceSiteId,
  getSitePageItemIdByFileName,
  doesSitePageExist
} from '../util'
import { IProjectNewsProps, TemplateFile } from '../types'

const REDIRECT_DELAY = 1100

export function useProjectNewsDialog(props: IProjectNewsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [spinnerMode, setSpinnerMode] = useState<'idle' | 'creating' | 'success'>('idle')
  const [title, setTitle] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [templates, setTemplates] = useState<TemplateFile[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined)
  const folderName = props.newsFolderName || strings.NewsFolderNameDefault
  const currentSiteId = props.context.pageContext.site.id.toString()

  useEffect(() => {
    if (isDialogOpen) {
      getTemplates(props.siteUrl, props.spHttpClient).then(setTemplates)
    }
  }, [isDialogOpen, props.siteUrl, props.spHttpClient])

  const handleTitleChange = useCallback((_: React.FormEvent, data: { value: string }): void => {
    setTitle(data.value)
    setErrorMessage('')
  }, [])

  const handleTemplateChange = useCallback((_: React.FormEvent, data: { optionValue: string }): void => {
    setSelectedTemplate(data.optionValue)
    setErrorMessage('')
  }, [])

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
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
        const newPageName = getNewsPageName(title)
        const exists = await doesSitePageExist(
          props.siteUrl,
          props.spHttpClient,
          folderName,
          newPageName
        )
        if (exists) {
          setErrorMessage(strings.NewsCreateDuplicateFileError)
          setSpinnerMode('idle')
          return
        }
        const newPageServerRelativeUrl = getServerRelativeUrl(
          props.siteUrl,
          'SitePages',
          folderName,
          newPageName
        )
        const res = await copyTemplatePage(
          props.siteUrl,
          props.spHttpClient,
          selectedTemplate,
          newPageServerRelativeUrl
        )
        const { itemId, sitePagesServerRelativeUrl } = await getSitePageItemIdByFileName(
          props.siteUrl,
          props.spHttpClient,
          newPageName
        )
        if (itemId) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await setOriginalSourceSiteId(
            props.siteUrl,
            props.spHttpClient,
            sitePagesServerRelativeUrl,
            itemId,
            currentSiteId
          )
        }
        if (res.ok) {
          setSpinnerMode('success')
          setTimeout(() => {
            setIsDialogOpen(false)
            setSpinnerMode('idle')
            setTitle('')
            setSelectedTemplate(undefined)
            const editUrl = getNewsEditUrl(props.siteUrl, folderName, newPageName)
            window.open(editUrl, '_blank')
          }, REDIRECT_DELAY)
        } else {
          const error = await res.json()
          setErrorMessage(
            `${strings.NewsCreateError} ${
              error.error?.message || error.error?.message?.value || error.message
            }`
          )
        }
      } catch (err: any) {
        setErrorMessage(
          `${strings.NewsCreateError} ${
            err?.error?.message || err?.error?.message?.value || err?.message
          }`
        )
        console.error('Error creating news article:', err)
        setSpinnerMode('idle')
      }
    },
    [title, selectedTemplate, props.siteUrl, props.spHttpClient, folderName]
  )
  return {
    isDialogOpen,
    setIsDialogOpen,
    spinnerMode,
    title,
    errorMessage,
    templates,
    selectedTemplate,
    handleTitleChange,
    handleTemplateChange,
    handleCreate
  }
}
