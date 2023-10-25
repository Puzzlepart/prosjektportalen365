import { ButtonProps } from '@fluentui/react-components'
import { SPDataAdapterBase } from '../../data'
import { ItemFieldValues, EditableSPField } from '../../models'
import { IBasePanelProps } from '../BasePanel'
import { UseModelReturnType } from './useModel'
import { IWeb } from '@pnp/sp/webs'

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

export interface ICustomEditPanelProps extends IBasePanelProps {
  /**
   * The fields to edit in the panel.
   */
  fields: EditableSPField[]

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
   * The web to use for fetching users, terms and list items.
   */
  targetWeb?: IWeb

  /**
   * Target list ID used to transform property valus
   * before submitting the item.
   */
  targetistId?: string

  /**
   * The submit button props.
   */
  submit?: ICustomEditPanelSubmitProps

  /**
   * Render the panel in debug mode.
   */
  debug?: boolean
}
