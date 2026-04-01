import { IProvisionField } from '../../types'

/**
 * Extra configuration for a specific field, providing field-specific
 * props, visibility overrides, validation states, and custom rendering behavior.
 */
export interface IFieldConfig {
  /** Override hidden state (e.g., conditional visibility) */
  hidden?: boolean
  /** Override disabled state */
  disabled?: boolean
  /** Override description (e.g., for validation messages) */
  description?: string | false
  /** Validation state for FieldContainer */
  validationState?: 'none' | 'error' | 'success' | 'warning'
  /** Validation message for FieldContainer */
  validationMessage?: string | false
  /** Extra props passed to the input component */
  inputProps?: Record<string, any>
  /** Options for choice/dropdown fields */
  options?: { key: string; text: string }[]
  /** Custom render function — if provided, replaces the default renderer */
  onRender?: (field: IProvisionField) => React.ReactNode
}

export interface IFieldRendererProps {
  field: IProvisionField
  config?: IFieldConfig
}

export interface IFieldRendererListProps {
  fields: IProvisionField[]
  level: number
  configs?: Record<string, IFieldConfig>
}
