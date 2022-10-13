import { IProgressIndicatorProps } from '@fluentui/react/lib/ProgressIndicator'
import { IDialogContentProps } from '@fluentui/react/lib/Dialog'

export interface IProgressDialogProps extends IDialogContentProps {
  progress: IProgressIndicatorProps
}
