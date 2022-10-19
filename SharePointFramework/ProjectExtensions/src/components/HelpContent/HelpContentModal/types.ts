import { HelpContentModel } from '../../../models/HelpContentModel'
import { IModalProps } from '@fluentui/react/lib/Modal'

export interface IHelpContentModalProps extends IModalProps {
  content: HelpContentModel[]
}
