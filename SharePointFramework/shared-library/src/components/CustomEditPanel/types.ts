import { IPanelProps } from '@fluentui/react'
import { ItemFieldValues, ProjectInformationField } from '../../models'
import { SPDataAdapterBase } from '../../data'

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

  targetistId?: string
}
