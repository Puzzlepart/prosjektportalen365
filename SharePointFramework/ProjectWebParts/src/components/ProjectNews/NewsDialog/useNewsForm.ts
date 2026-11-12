import { useState, useCallback, useRef } from 'react'
import strings from 'ProjectWebPartsStrings'

/**
 * What the create button waits for, said in its description while it cannot be used (WCAG 3.3.2):
 * a title, a template or both, or a change after an error; `undefined` when nothing is missing.
 */
function getCreateDisabledReason(
  title: string,
  selectedTemplate: string | undefined,
  errorMessage: string
): string | undefined {
  if (!title && !selectedTemplate) return strings.CreateButtonNeedsTitleAndTemplate
  if (!title) return strings.CreateButtonNeedsTitle
  if (!selectedTemplate) return strings.CreateButtonNeedsTemplate
  if (errorMessage) return strings.CreateButtonNeedsChange
  return undefined
}

/** Manages the news title and template selection with validation and reset handlers. */
export const useNewsForm = () => {
  const [title, setTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState('')
  // The template field says it is required only once it has been left without one, not from the
  // moment the dialog opens (WCAG 3.3.1).
  const [isTemplateTouched, setTemplateTouched] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const isTitleValid = !!title && !errorMessage
  const isTemplateValid = !!selectedTemplate
  const isFormValid = isTitleValid && isTemplateValid
  const showTemplateError = isTemplateTouched && !isTemplateValid
  const createDisabledReason = getCreateDisabledReason(title, selectedTemplate, errorMessage)

  const handleTitleChange = useCallback((_: React.FormEvent, data: { value: string }): void => {
    setTitle(data.value)
    setErrorMessage('')
  }, [])

  const handleTemplateChange = useCallback(
    (_: React.FormEvent, data: { optionValue: string }): void => {
      setSelectedTemplate(data.optionValue)
      setErrorMessage('')
    },
    []
  )

  const handleTemplateBlur = useCallback(() => setTemplateTouched(true), [])

  /** Forgets that the template field was left, so a new opening starts without its error. */
  const resetValidation = useCallback(() => setTemplateTouched(false), [])

  /**
   * Validates the form and sets appropriate error messages
   */
  const validateForm = useCallback((): boolean => {
    if (!title.trim()) {
      setErrorMessage(strings.NewsTitleRequired)
      return false
    }
    if (!selectedTemplate) {
      setErrorMessage(strings.TemplateRequired)
      return false
    }
    setErrorMessage('')
    return true
  }, [title, selectedTemplate])

  const resetForm = useCallback(() => {
    setTitle('')
    setSelectedTemplate(undefined)
    setErrorMessage('')
    setTemplateTouched(false)
  }, [])

  const setFormErrorMessage = useCallback((message: string) => {
    setErrorMessage(message)
  }, [])

  return {
    title,
    selectedTemplate,
    errorMessage,
    isTitleValid,
    isTemplateValid,
    isFormValid,
    showTemplateError,
    createDisabledReason,
    handleTitleChange,
    handleTemplateChange,
    handleTemplateBlur,
    validateForm,
    resetForm,
    resetValidation,
    setFormErrorMessage,
    inputRef
  }
}
