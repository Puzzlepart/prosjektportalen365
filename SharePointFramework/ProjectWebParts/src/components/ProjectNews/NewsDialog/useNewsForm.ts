import { useState, useCallback, useRef } from 'react'
import strings from 'ProjectWebPartsStrings'

/**
 * Hook for managing news form state and validation
 */
export const useNewsForm = () => {
  const [title, setTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined)
  const [errorMessage, setErrorMessage] = useState('')

  const inputRef = useRef<HTMLInputElement>(null)
  const isTitleValid = !!title && !errorMessage
  const isTemplateValid = !!selectedTemplate
  const isFormValid = isTitleValid && isTemplateValid

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

  /**
   * Validates the form and sets appropriate error messages
   * @returns true if form is valid, false otherwise
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
    handleTitleChange,
    handleTemplateChange,
    validateForm,
    resetForm,
    setFormErrorMessage,
    inputRef
  }
}
