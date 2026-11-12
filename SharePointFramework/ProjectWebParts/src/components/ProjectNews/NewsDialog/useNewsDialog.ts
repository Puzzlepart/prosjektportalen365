/* eslint-disable no-console */
import React, { useState, useEffect, useCallback, useContext } from 'react'
import { useAnnounce } from '@fluentui/react-components'
import { format, isUnauthorizedError } from 'pp365-shared-library'
import strings from 'ProjectWebPartsStrings'
import {
  ensureProjectNewsFolder,
  getTemplates,
  getNewsPageName,
  getServerRelativeUrl,
  copyTemplatePage,
  getNewsEditUrl,
  setOriginalSourceSiteId,
  getSitePageItemId,
  doesSitePageExist,
  recycleSitePage,
  validateSharePointFileName
} from '../util'
import { getRestErrorMessage, toUrlPath } from '../rest'
import { TemplateFile } from '../types'
import { ProjectNewsContext } from '../context'
import { useNewsForm } from './useNewsForm'

/** Loads page templates and creates project-linked news with progress and recoverable error feedback. */
export const useNewsDialog = () => {
  const context = useContext(ProjectNewsContext)
  const newsForm = useNewsForm()
  // The dialog's content gives way to a spinner and then to the result, which a screen reader is
  // told of (WCAG 4.1.3); an error shows in the title field's message, which Fluent reads out.
  const { announce } = useAnnounce()

  const [spinnerMode, setSpinnerMode] = useState<'idle' | 'creating' | 'success'>('idle')
  const [templates, setTemplates] = useState<TemplateFile[]>([])

  const folderName = context.props.newsFolderName || strings.NewsFolderNameDefault
  const currentSiteId = context.props.context.pageContext.site.id.toString()
  const canCreate = newsForm.isFormValid && spinnerMode === 'idle'
  const selected = templates.find(
    (t: TemplateFile) => t.ServerRelativeUrl === newsForm.selectedTemplate
  )
  const origin = window.location.origin
  const previewUrl = selected ? `${origin}${toUrlPath(selected.ServerRelativeUrl)}?Mode=Read` : null

  useEffect(() => {
    if (context.state.isDialogOpen) {
      void getTemplates(context.props.siteUrl, context.props.spHttpClient).then(setTemplates)
    }
  }, [context.state.isDialogOpen, context.props.siteUrl, context.props.spHttpClient])

  const handleCreate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!newsForm.validateForm()) {
        return
      }
      const newPageName = getNewsPageName(newsForm.title)
      // The page's name leaves out what a file name cannot have; a title with nothing else, or
      // one that is a reserved name, is refused here, before anything is made.
      const pageNameError = validateSharePointFileName(newPageName.replace(/\.aspx$/, ''))
      if (pageNameError !== true) {
        newsForm.setFormErrorMessage(pageNameError)
        return
      }

      setSpinnerMode('creating')
      announce(strings.CreatingNewArticleStatus, { polite: true })
      newsForm.setFormErrorMessage('')

      /**
       * Shows why the article was not created, after `note` when there is one, and gives the
       * form back so the user can try again.
       */
      const showError = (error: any, note?: string) => {
        newsForm.setFormErrorMessage(
          // A news site that refuses the user, such as the hub for a member of «Minimum
          // lesetilganger på hub», says so instead of giving SharePoint's message.
          isUnauthorizedError(error)
            ? strings.NewsNoAccessErrorText
            : [strings.NewsCreateError, getRestErrorMessage(error), note].filter(Boolean).join(' ')
        )
        console.error('Error creating news article:', error)
        setSpinnerMode('idle')
      }

      try {
        await ensureProjectNewsFolder(context.props.siteUrl, context.props.spHttpClient, folderName)
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
        if (!res.ok) {
          // SharePoint's error body has no status: with it, a refused copy says access is missing.
          showError({ ...(await res.json()), status: res.status })
          return
        }
        try {
          const { itemId, sitePagesServerRelativeUrl } = await getSitePageItemId(
            context.props.siteUrl,
            context.props.spHttpClient,
            newPageServerRelativeUrl
          )
          await new Promise((resolve) => setTimeout(resolve, 500))
          await setOriginalSourceSiteId(
            context.props.siteUrl,
            context.props.spHttpClient,
            sitePagesServerRelativeUrl,
            itemId,
            currentSiteId,
            context.props.pageContext.legacyPageContext.hubSiteId,
            newsForm.title
          )
        } catch (error) {
          // The page is copied but not tied to the project (its item not found, or not updated).
          // Left behind, it is a draft with the template's title that the project's news never
          // lists, and it blocks a new try under the same title.
          const removed = await recycleSitePage(
            context.props.siteUrl,
            context.props.spHttpClient,
            newPageServerRelativeUrl
          ).then(
            () => true,
            () => false
          )
          showError(
            error,
            removed
              ? undefined
              : format(strings.NewsCreateLeftoverPageError, newPageName, folderName)
          )
          return
        }
        setSpinnerMode('success')
        announce(strings.NewsCreatedSuccessfully, { polite: true })
        setTimeout(() => {
          context.setState({ isDialogOpen: false })
          setSpinnerMode('idle')
          newsForm.resetForm()
          const editUrl = getNewsEditUrl(context.props.siteUrl, folderName, newPageName)
          window.open(editUrl, '_blank')
        }, 1100)
      } catch (err: any) {
        showError(err)
      }
    },
    [
      newsForm,
      context.props.siteUrl,
      context.props.spHttpClient,
      folderName,
      currentSiteId,
      context,
      announce
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
