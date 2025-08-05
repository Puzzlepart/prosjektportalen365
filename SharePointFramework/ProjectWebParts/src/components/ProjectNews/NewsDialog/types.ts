import { TemplateFile } from '../types'

export interface INewsDialogProps {
  /**
   * The current state of the spinner in the dialog
   * - 'idle': No action is being performed
   * - 'creating': A new news article is being created
   * - 'success': The news article has been successfully created
   */
  spinnerMode?: 'idle' | 'creating' | 'success'

  /**
   * The title of the news article being created
   */
  title?: string

  /**
   * The error message to display in the dialog when an error occurs
   */
  errorMessage?: string

  /**
   * Handler for title input changes
   * @param e - The event object
   * @param data - The data containing the new title value
   */
  onTitleChange?: (e: React.FormEvent, data: { value: string }) => void

  /**
   * Handler for form submission
   * @param e - The event object
   */
  onSubmit?: (e: React.FormEvent) => void

  /**
   * Array of available templates for creating news articles
   */
  templates?: TemplateFile[]

  /**
   * The currently selected template for creating a news article
   */
  selectedTemplate?: string

  /**
   * Handler for template selection changes
   * @param e - The event object
   * @param data - The data containing the selected template option value
   */
  onTemplateChange?: (e: React.FormEvent, data: { optionValue: string }) => void
}
