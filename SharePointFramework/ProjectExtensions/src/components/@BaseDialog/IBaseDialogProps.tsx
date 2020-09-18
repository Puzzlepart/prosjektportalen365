import { IDialogProps } from 'office-ui-fabric-react/lib/Dialog'

export interface IBaseDialogProps extends IDialogProps {
    /**
     * On render footer
     */
    onRenderFooter?: () => React.ReactElement<any>;

    /**
     * Version from extension manifest
     */
    version?: string;
}
