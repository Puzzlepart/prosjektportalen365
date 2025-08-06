/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useContext } from 'react'
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
import { TemplateFile } from '../types'
import { ProjectNewsContext } from '../context'
import { useNewsForm } from './useNewsForm'

/**
 * Component logic hook for `NewsDialog`
 */
export const useNewsDialog = () => {
  const context = useContext(ProjectNewsContext)
  const newsForm = useNewsForm()

  const [spinnerMode, setSpinnerMode] = useState<'idle' | 'creating' | 'success'>('idle')
  const [templates, setTemplates] = useState<TemplateFile[]>([])

  const folderName = context.props.newsFolderName || strings.NewsFolderNameDefault
  const currentSiteId = context.props.context.pageContext.site.id.toString()
  const canCreate = newsForm.isFormValid && spinnerMode === 'idle'
  const selected = templates.find(
    (t: TemplateFile) => t.ServerRelativeUrl === newsForm.selectedTemplate
  )
  const origin = window.location.origin
  const previewUrl = selected ? `${origin}${selected.ServerRelativeUrl}?Mode=Read` : null

  useEffect(() => {
    if (context.state.isDialogOpen) {
      getTemplates(context.props.siteUrl, context.props.spHttpClient).then(setTemplates)
    }
  }, [context.state.isDialogOpen, context.props.siteUrl, context.props.spHttpClient])

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      // Use the form validation from the hook
      if (!newsForm.validateForm()) {
        return
      }

      setSpinnerMode('creating')
      newsForm.setFormErrorMessage('')

      try {
        await ensureProjectNewsFolder(context.props.siteUrl, context.props.spHttpClient, folderName)
        const newPageName = getNewsPageName(newsForm.title)
        const exists = await doesSitePageExist(
          context.props.siteUrl,
          context.props.spHttpClient,
          folderName,
          newPageName
        )
        if (exists) {
          newsForm.setFormErrorMessage(strings.NewsCreateDuplicateFileError)
          setSpinnerMode('idle')
          return
        }
        const newPageServerRelativeUrl = getServerRelativeUrl(
          context.props.siteUrl,
          'SitePages',
          folderName,
          newPageName
        )
        const res = await copyTemplatePage(
          context.props.siteUrl,
          context.props.spHttpClient,
          newsForm.selectedTemplate,
          newPageServerRelativeUrl
        )
        const { itemId, sitePagesServerRelativeUrl } = await getSitePageItemIdByFileName(
          context.props.siteUrl,
          context.props.spHttpClient,
          newPageName
        )
        if (itemId) {
          await new Promise((resolve) => setTimeout(resolve, 500))
          await setOriginalSourceSiteId(
            context.props.siteUrl,
            context.props.spHttpClient,
            sitePagesServerRelativeUrl,
            itemId,
            currentSiteId,
            context.props.pageContext.legacyPageContext.hubSiteId
          )
        }
        if (res.ok) {
          setSpinnerMode('success')
          setTimeout(() => {
            context.setState({ isDialogOpen: false })
            setSpinnerMode('idle')
            newsForm.resetForm()
            const editUrl = getNewsEditUrl(context.props.siteUrl, folderName, newPageName)
            window.open(editUrl, '_blank')
          }, 1100)
        } else {
          const error = await res.json()
          newsForm.setFormErrorMessage(
            `${strings.NewsCreateError} ${
              error.error?.message || error.error?.message?.value || error.message
            }`
          )
        }
      } catch (err: any) {
        newsForm.setFormErrorMessage(
          `${strings.NewsCreateError} ${
            err?.error?.message || err?.error?.message?.value || err?.message
          }`
        )
        console.error('Error creating news article:', err)
        setSpinnerMode('idle')
      }
    },
    [
      newsForm,
      context.props.siteUrl,
      context.props.spHttpClient,
      folderName,
      currentSiteId,
      context
    ]
  )

  return {
    spinnerMode,
    title: newsForm.title,
    errorMessage: newsForm.errorMessage,
    templates,
    selected,
    selectedTemplate: newsForm.selectedTemplate,
    handleTitleChange: newsForm.handleTitleChange,
    handleTemplateChange: newsForm.handleTemplateChange,
    handleCreate,
    canCreate,
    inputRef: newsForm.inputRef,
    previewUrl,
    isTemplateValid: newsForm.isTemplateValid,
    isTitleValid: newsForm.isTitleValid
  }
}
