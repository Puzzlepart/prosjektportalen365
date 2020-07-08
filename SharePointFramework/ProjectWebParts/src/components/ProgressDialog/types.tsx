import { IProgressIndicatorProps } from 'office-ui-fabric-react/lib/ProgressIndicator'
import { IDialogContentProps } from 'office-ui-fabric-react/lib/Dialog'

export interface IProgressDialogProps extends IDialogContentProps {
    progress: IProgressIndicatorProps;
}
