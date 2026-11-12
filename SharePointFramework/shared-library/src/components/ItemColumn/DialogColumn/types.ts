import { IRenderItemColumnProps } from '../types'
import { DialogProps } from '@fluentui/react-components'

/**
 * Configures a measurement-history dialog and its link and heading fields.
 */
export interface IDialogColumnProps extends Omit<DialogProps, 'children'>, IRenderItemColumnProps {
  headerTitleField?: string
  headerSubTitleField?: string
  linkText?: string
  showInfoText?: boolean
  infoTextTemplate?: string
}
