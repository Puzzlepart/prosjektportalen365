import { IPanelProps } from '@fluentui/react'
import { ButtonProps } from '@fluentui/react-components'
import { SPDataAdapterBase } from '../../data'
import { ItemFieldValues, ProjectInformationField } from '../../models'
import { UseModelReturnType } from './useModel'

export interface ICustomEditPanelSubmitProps extends Pick<ButtonProps, 'disabled'> {
  /**
   * Callback function to execute when the submit button is clicked.
   *
   * @param model The model to submit.
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
   * Error text to display in a `<UserMessage />` component if
   * the submit fails (optional)
   */
  error?: string
}

export interface ICustomEditPanelProps extends IPanelProps {
  /**
   * The fields to edit in the panel.
   */
  fields: ProjectInformationField[]

  /**
   * Field values for the list item
   */
  fieldValues: ItemFieldValues

  /**
   * The data adapter to use for fetching terms and users for
   * the fields.
   */
  dataAdapter: SPDataAdapterBase

  /**
   * The fiels to be hidden in the panel.
   */
  hiddenFields?: string[]

  /**
   * Target list ID used to transform property valus
   * before submitting the item.
   */
  targetistId?: string

  /**
   * The submit button props.
   */
  submit?: ICustomEditPanelSubmitProps
}
