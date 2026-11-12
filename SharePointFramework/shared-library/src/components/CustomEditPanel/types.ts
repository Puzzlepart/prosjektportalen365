import { ButtonProps } from '@fluentui/react-components'
import { SPDataAdapterBase } from '../../data'
import { ItemFieldValues, EditableSPField } from '../../models'
import { IBasePanelProps } from '../BasePanel'
import { UseModelReturnType } from './useModel'
import { IWeb } from '@pnp/sp/webs'

/**
 * Defines edit-panel submission and its progress and error messages.
 */
export interface ICustomEditPanelSubmitProps extends Pick<ButtonProps, 'disabled'> {
  /**
   * Callback function to execute when the submit button is clicked.
   */
  onSubmit: (model: UseModelReturnType) => Promise<void>

  /**
   * Text to display in the submit button (optional)
   */
  text?: string

  /**
   * Text to display in the progress bar while saving (optional)
   */
  saveProgressText?: string

  /**
   * Error message to display in a `<UserMessage />` component if
   * the submit fails (optional)
   */
  error?: string
}

/**
 * Configures SharePoint fields, values and submission for an edit drawer.
 */
export interface ICustomEditPanelProps extends IBasePanelProps {
  fields: EditableSPField[]

  fieldValues: ItemFieldValues

  /**
   * The data adapter to use for fetching terms and users for
   * the fields.
   */
  dataAdapter: SPDataAdapterBase

  hiddenFields?: string[]

  /**
   * The web to use for fetching users, terms and list items.
   */
  targetWeb?: IWeb

  /**
   * Target list ID used to transform property values
   * before submitting the item.
   */
  targetListId?: string

  /**
   * Allowed lookup values for specific fields. Key is the internal field name,
   * value is an array of allowed text values for that lookup field.
   * Used to filter lookup options based on external configuration.
   */
  allowedLookupValues?: Record<string, string[]>

  submit?: ICustomEditPanelSubmitProps

  debug?: boolean
}
