import { IBaseDialogProps } from '../@BaseDialog/IBaseDialogProps';
import { MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';

export interface IErrorDialogProps extends IBaseDialogProps {
    /**
     * Error object
     */
    error: Error;

    /**
     * Message type
     */
    messageType?: MessageBarType;
}
