import { IMessageBarProps } from 'office-ui-fabric-react/lib/MessageBar'

export interface IUserMessageProps extends IMessageBarProps {
    /**
     * Message text
     */
    text: string;
}
