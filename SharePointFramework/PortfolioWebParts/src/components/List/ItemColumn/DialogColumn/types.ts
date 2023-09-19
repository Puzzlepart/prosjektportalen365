import { IRenderItemColumnProps } from '../types'
import { DialogProps } from '@fluentui/react-components'

export interface IDialogColumnProps extends Omit<DialogProps, 'children'>, IRenderItemColumnProps {
  headerTitleField?: string
  headerSubTitleField?: string
  linkText?: string
  showInfoText?: boolean
  infoTextTemplate?: string
}
