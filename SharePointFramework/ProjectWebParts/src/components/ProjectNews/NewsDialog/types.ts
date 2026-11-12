import { TemplateFile } from '../types'

/** News form values, template choices and submission callbacks. */
export interface INewsDialogProps {
  /**
   * The current state of the spinner in the dialog
   * - 'idle': No action is being performed
   * - 'creating': A new news article is being created
   * - 'success': The news article has been successfully created
   */
  spinnerMode?: 'idle' | 'creating' | 'success'

  title?: string

  /**
   * The error message to display in the dialog when an error occurs
   */
  errorMessage?: string

  onTitleChange?: (e: React.FormEvent, data: { value: string }) => void

  onSubmit?: (e: React.FormEvent) => void

  templates?: TemplateFile[]

  selectedTemplate?: string

  onTemplateChange?: (e: React.FormEvent, data: { optionValue: string }) => void
}
